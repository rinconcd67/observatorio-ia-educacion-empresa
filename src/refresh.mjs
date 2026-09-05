import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { fetchResource } from "./lib/http.mjs";
import { parseCsv } from "./lib/csv.mjs";
import { readJson, sha256Bytes, writeBytes, writeJson } from "./lib/io.mjs";
import { decodeJsonStat } from "./lib/jsonstat.mjs";
import { resolveSourceRequest } from "./lib/temporal-policy.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const configPath = join(root, "config", "active_sources.json");
const rawDirectory = join(root, "data", "raw");
const processedDirectory = join(root, "data", "processed");

const EUROSTAT_ISO2_OVERRIDES = new Map([
  ["EL", "GR"],
  ["UK", "GB"],
]);

const METRIC_DEFINITIONS = {
  enterprise_ai_adoption: {
    name: "Empresas que usan al menos una tecnología de IA",
    unit: "porcentaje",
    sector: "empresa",
  },
  formal_education_genai_use: {
    name: "Personas que usan IA generativa para educación formal",
    unit: "porcentaje",
    sector: "educacion",
  },
  student_genai_use: {
    name: "Estudiantes que usan herramientas de IA generativa",
    unit: "porcentaje",
    sector: "educacion",
  },
  individual_genai_use: {
    name: "Personas que usan herramientas de IA generativa",
    unit: "porcentaje",
    sector: "individuos",
  },
  internet_users: {
    name: "Personas que usan Internet",
    unit: "porcentaje",
    sector: "contexto",
  },
  tertiary_enrollment: {
    name: "Tasa bruta de matrícula en educación terciaria",
    unit: "porcentaje",
    sector: "contexto_educativo",
  },
  gdp_per_capita: {
    name: "PIB per cápita",
    unit: "USD_corrientes",
    sector: "contexto_economico",
  },
};

const OECD_FILTERS = {
  oecd_ict_businesses: {
    MEASURE: "G14_B",
    UNIT_MEASURE: "PT_ENT",
    ACTIVITY: "_T",
    SIZE_CLASS: "S_GE10",
  },
  oecd_individual_genai: {
    MEASURE: "D1X_I",
    UNIT_MEASURE: "PT_POP",
    AGE: "Y16T74",
    SEX: "_T",
    EDUCATION_LEVEL: "_T",
    INCOME_GROUP: "_T",
    EMP_STATUS: "_T",
  },
};

function validAsOf(value) {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value ?? Date.now());
  if (Number.isNaN(date.getTime())) throw new TypeError("refresh requiere asOf como fecha válida");
  return date;
}

function nowIso(clock = new Date()) {
  return validAsOf(clock).toISOString();
}

function normalizeCountries(payload) {
  const rows = Array.isArray(payload) ? payload[1] ?? [] : [];
  return rows
    .filter((row) => row?.region?.value && row.region.value !== "Aggregates")
    .map((row) => ({
      iso2: row.iso2Code,
      iso3: row.id,
      country: row.name,
      region: row.region.value,
      income_group: row.incomeLevel?.value || "Sin clasificación",
      lending_type: row.lendingType?.value || "No aplica",
    }))
    .sort((left, right) => left.country.localeCompare(right.country, "es"));
}

function countryMaps(countries) {
  return {
    byIso2: new Map(countries.map((country) => [country.iso2, country])),
    byIso3: new Map(countries.map((country) => [country.iso3, country])),
  };
}

function normalizeEurostat(payload, source, maps) {
  const definition = METRIC_DEFINITIONS[source.metric_id];
  return decodeJsonStat(payload).flatMap((row) => {
    const normalizedIso2 = EUROSTAT_ISO2_OVERRIDES.get(row.geo) ?? row.geo;
    const country = maps.byIso2.get(normalizedIso2);
    if (!country || !/^\d{4}$/.test(String(row.time))) return [];
    return [{
      iso3: country.iso3,
      iso2: country.iso2,
      country: country.country,
      region: country.region,
      income_group: country.income_group,
      year: Number(row.time),
      sector: definition.sector,
      metric_id: source.metric_id,
      metric_name: definition.name,
      value: Number(row.value),
      unit: definition.unit,
      source_id: source.id,
      source_dataset: source.dataset,
    }];
  });
}

function normalizeWorldBank(payload, source, maps) {
  const rows = Array.isArray(payload) ? payload[1] ?? [] : [];
  const definition = METRIC_DEFINITIONS[source.metric_id];
  return rows.flatMap((row) => {
    const country = maps.byIso3.get(row.countryiso3code);
    if (!country || row.value === null || row.value === undefined) return [];
    return [{
      iso3: country.iso3,
      iso2: country.iso2,
      country: country.country,
      region: country.region,
      income_group: country.income_group,
      year: Number(row.date),
      sector: definition.sector,
      metric_id: source.metric_id,
      metric_name: definition.name,
      value: Number(row.value),
      unit: definition.unit,
      source_id: source.id,
      source_dataset: source.dataset,
    }];
  });
}

export function normalizeOecd(payload, source, maps) {
  const definition = METRIC_DEFINITIONS[source.metric_id];
  const requiredFilters = OECD_FILTERS[source.id];
  const rows = parseCsv(payload);
  const requiredColumns = ["REF_AREA", "TIME_PERIOD", "OBS_VALUE", ...Object.keys(requiredFilters)];
  if (!rows.length || requiredColumns.some((column) => !(column in rows[0]))) {
    throw new Error(`${source.id}: respuesta SDMX-CSV vacía o esquema incompatible`);
  }
  return rows.flatMap((row) => {
    const matches = Object.entries(requiredFilters).every(([field, value]) => row[field] === value);
    const country = maps.byIso3.get(row.REF_AREA);
    const year = Number(row.TIME_PERIOD);
    if (row.OBS_VALUE == null || String(row.OBS_VALUE).trim() === "") return [];
    const value = Number(row.OBS_VALUE);
    if (!matches || !country || !Number.isInteger(year) || !Number.isFinite(value)) return [];
    return [{
      iso3: country.iso3,
      iso2: country.iso2,
      country: country.country,
      region: country.region,
      income_group: country.income_group,
      year,
      sector: definition.sector,
      metric_id: source.metric_id,
      metric_name: definition.name,
      value,
      unit: definition.unit,
      source_id: source.id,
      source_dataset: source.dataset,
    }];
  });
}

async function readOptionalJson(path, fallback) {
  try {
    return await readJson(path);
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

function decodeResource(bytes, format) {
  const text = new TextDecoder("utf-8").decode(bytes);
  return format === "csv" ? text : JSON.parse(text);
}

async function downloadSources(sources, { asOf }) {
  const downloaded = new Map();
  const runs = [];
  await mkdir(rawDirectory, { recursive: true });

  for (const source of sources) {
    const startedAt = nowIso();
    let request;
    try {
      const format = source.format ?? "json";
      request = resolveSourceRequest(source, { asOf });
      const resource = await fetchResource(request.url, {
        headers: { accept: format === "csv" ? "text/csv" : "application/json" },
      });
      const payload = decodeResource(resource.bytes, format);
      const rawPath = join(rawDirectory, `${source.id}.${format}`);
      await writeBytes(rawPath, resource.bytes);
      downloaded.set(source.id, payload);
      const rawSha256 = sha256Bytes(resource.bytes);
      runs.push({
        source_id: source.id,
        status: "ok",
        started_at: startedAt,
        completed_at: nowIso(),
        policy_mode: request.policy_mode,
        requested_start_year: request.requested_start_year,
        requested_end_year: request.requested_end_year,
        as_of_date: asOf.toISOString(),
        base_url: source.url,
        requested_url: request.url,
        resolved_url: resource.url,
        raw_sha256: rawSha256,
        checksum_sha256: rawSha256,
        checksum_scope: "stored_file_bytes",
        checksum_algorithm: "sha256",
        raw_size_bytes: resource.bytes.byteLength,
        raw_content_type: resource.contentType,
        http_status: resource.status,
        http_attempts: resource.attempts,
        etag: resource.etag,
        last_modified: resource.lastModified,
        raw_path: `data/raw/${source.id}.${format}`,
      });
    } catch (error) {
      runs.push({
        source_id: source.id,
        status: "error",
        started_at: startedAt,
        completed_at: nowIso(),
        policy_mode: request?.policy_mode ?? source.time_policy?.mode ?? null,
        requested_start_year: request?.requested_start_year ?? null,
        requested_end_year: request?.requested_end_year ?? null,
        as_of_date: asOf.toISOString(),
        error: error.message,
        http_status: error.status ?? null,
        http_attempts: error.attempts ?? null,
      });
    }
  }

  const requiredIds = new Set(sources.filter((source) => source.required).map((source) => source.id));
  const failures = runs.filter((run) => run.status === "error" && requiredIds.has(run.source_id));
  if (failures.length) {
    await writeJson(join(processedDirectory, "source_runs.json"), runs);
    throw new Error(`Fallaron ${failures.length} fuentes: ${failures.map((run) => run.source_id).join(", ")}`);
  }
  return { downloaded, runs };
}

export async function refresh(options = {}) {
  const asOf = validAsOf(options.asOf);
  const config = await readJson(configPath);
  const activeSources = config.sources.filter((source) => source.active);
  const { downloaded, runs } = await downloadSources(activeSources, { asOf });

  const countriesSource = activeSources.find((source) => source.id === "world_bank_countries");
  const countries = normalizeCountries(downloaded.get(countriesSource.id));
  const aipiObservations = await readOptionalJson(join(processedDirectory, "imf_aipi_observations.json"), []);
  const aipiRun = await readOptionalJson(join(processedDirectory, "imf_aipi_run.json"), null);
  const oxfordObservations = await readOptionalJson(join(processedDirectory, "oxford_readiness_observations.json"), []);
  const oxfordRun = await readOptionalJson(join(processedDirectory, "oxford_readiness_run.json"), null);

  const knownCountries = new Set(countries.map((country) => country.iso3));
  for (const row of aipiObservations) {
    if (knownCountries.has(row.iso3)) continue;
    countries.push({
      iso2: row.iso2 ?? "",
      iso3: row.iso3,
      country: row.country,
      region: "Sin clasificación regional",
      income_group: row.aipi_group ?? "Sin clasificación",
      lending_type: "No aplica",
    });
    knownCountries.add(row.iso3);
  }
  countries.sort((left, right) => left.country.localeCompare(right.country, "es"));
  const maps = countryMaps(countries);
  const controlledObservations = [...aipiObservations, ...oxfordObservations];
  const observations = [...controlledObservations.map((row) => {
    const country = maps.byIso3.get(row.iso3);
    return {
      ...row,
      iso2: country?.iso2 ?? row.iso2 ?? "",
      country: country?.country ?? row.country,
      region: country?.region ?? row.region,
      income_group: country?.income_group ?? row.income_group,
    };
  })];

  for (const source of activeSources) {
    if (!source.metric_id) continue;
    const payload = downloaded.get(source.id);
    if (!payload) continue;
    if (source.id.startsWith("eurostat_")) {
      observations.push(...normalizeEurostat(payload, source, maps));
    } else if (source.id.startsWith("oecd_")) {
      observations.push(...normalizeOecd(payload, source, maps));
    } else if (source.id.startsWith("world_bank_")) {
      observations.push(...normalizeWorldBank(payload, source, maps));
    }
  }

  if (aipiRun) runs.push(aipiRun);
  if (oxfordRun) runs.push(oxfordRun);

  observations.sort((left, right) =>
    left.metric_id.localeCompare(right.metric_id) ||
    left.iso3.localeCompare(right.iso3) ||
    left.year - right.year);

  const executionYear = asOf.getUTCFullYear();
  for (const run of runs) {
    const sourceRows = observations.filter((row) => row.source_id === run.source_id);
    const years = sourceRows.map((row) => row.year).filter(Number.isInteger);
    if (sourceRows.length) run.records = sourceRows.length;
    run.returned_min_year = years.length ? Math.min(...years) : null;
    run.returned_max_year = years.length ? Math.max(...years) : null;
    run.returned_years = [...new Set(years)].sort((left, right) => left - right);
    if (Number.isInteger(run.returned_max_year) && run.returned_max_year > executionYear) {
      throw new Error(`${run.source_id} devolvió el año futuro ${run.returned_max_year} para una ejecución ${executionYear}.`);
    }
  }

  const snapshot = {
    schema_version: 1,
    generated_at: nowIso(asOf),
    as_of_date: asOf.toISOString(),
    status: runs.every((run) => run.status === "ok") ? "ready" : "degraded",
    countries_count: countries.length,
    observations_count: observations.length,
    active_sources_count: activeSources.length + (aipiRun ? 1 : 0) + (oxfordRun ? 1 : 0),
    healthy_sources_count: runs.filter((run) => run.status === "ok").length,
    countries,
    observations,
    source_runs: runs,
  };

  await writeJson(join(processedDirectory, "countries.json"), countries);
  await writeJson(join(processedDirectory, "observations.json"), observations);
  await writeJson(join(processedDirectory, "source_runs.json"), runs);
  await writeJson(join(processedDirectory, "snapshot.json"), snapshot);
  return snapshot;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  refresh({ asOf: process.env.OBSERVATORY_AS_OF })
    .then((snapshot) => {
      console.log(JSON.stringify({
        ok: true,
        generated_at: snapshot.generated_at,
        countries: snapshot.countries_count,
        observations: snapshot.observations_count,
        sources: snapshot.active_sources_count,
      }));
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
