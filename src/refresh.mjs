import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { fetchJson } from "./lib/http.mjs";
import { checksum, readJson, writeJson } from "./lib/io.mjs";
import { decodeJsonStat } from "./lib/jsonstat.mjs";

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

function nowIso() {
  return new Date().toISOString();
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

async function downloadSources(sources) {
  const downloaded = new Map();
  const runs = [];
  await mkdir(rawDirectory, { recursive: true });

  for (const source of sources) {
    const startedAt = nowIso();
    try {
      const payload = await fetchJson(source.url);
      const rawPath = join(rawDirectory, `${source.id}.json`);
      await writeJson(rawPath, payload);
      downloaded.set(source.id, payload);
      runs.push({
        source_id: source.id,
        status: "ok",
        started_at: startedAt,
        completed_at: nowIso(),
        checksum_sha256: checksum(payload),
        raw_path: `data/raw/${source.id}.json`,
      });
    } catch (error) {
      runs.push({
        source_id: source.id,
        status: "error",
        started_at: startedAt,
        completed_at: nowIso(),
        error: error.message,
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

export async function refresh() {
  const config = await readJson(configPath);
  const activeSources = config.sources.filter((source) => source.active);
  const { downloaded, runs } = await downloadSources(activeSources);

  const countriesSource = activeSources.find((source) => source.id === "world_bank_countries");
  const countries = normalizeCountries(downloaded.get(countriesSource.id));
  const maps = countryMaps(countries);
  const observations = [];

  for (const source of activeSources) {
    if (!source.metric_id) continue;
    const payload = downloaded.get(source.id);
    if (!payload) continue;
    if (source.id.startsWith("eurostat_")) {
      observations.push(...normalizeEurostat(payload, source, maps));
    } else if (source.id.startsWith("world_bank_")) {
      observations.push(...normalizeWorldBank(payload, source, maps));
    }
  }

  observations.sort((left, right) =>
    left.metric_id.localeCompare(right.metric_id) ||
    left.iso3.localeCompare(right.iso3) ||
    left.year - right.year);

  const snapshot = {
    schema_version: 1,
    generated_at: nowIso(),
    status: "ready",
    countries_count: countries.length,
    observations_count: observations.length,
    active_sources_count: activeSources.length,
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
  refresh()
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
