import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { fetchText } from "./lib/http.mjs";
import { checksum, readJson, writeJson, writeText } from "./lib/io.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const configPath = join(root, "config", "controlled_downloads.json");
const countriesPath = join(root, "data", "processed", "countries.json");
const rawPath = join(root, "data", "raw", "oxford_government_ai_readiness_2025.html");
const processedDirectory = join(root, "data", "processed");

const METRICS = new Map([
  ["total", ["government_ai_readiness", "Índice de preparación gubernamental para la IA"]],
  ["policy_capacity", ["government_policy_capacity", "Capacidad de política pública para la IA"]],
  ["ai_infrastructure", ["government_ai_infrastructure", "Infraestructura de IA"]],
  ["governance", ["government_ai_governance", "Gobernanza de la IA"]],
  ["public_sector_adoption", ["government_public_sector_adoption", "Adopción de IA en el sector público"]],
  ["development_diffusion", ["government_development_diffusion", "Desarrollo y difusión de la IA"]],
  ["resilience", ["government_ai_resilience", "Resiliencia ante la IA"]],
]);

function nowIso() {
  return new Date().toISOString();
}

function extractIndexData(html) {
  const match = html.match(/<script[^>]*id=["']index-data-2025["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!match) throw new Error("No se encontró el bloque oficial index-data-2025 de Oxford Insights.");
  const rows = JSON.parse(match[1]);
  if (!Array.isArray(rows) || rows.length < 190) {
    throw new Error(`Oxford devolvió una cobertura inesperada: ${Array.isArray(rows) ? rows.length : 0} gobiernos.`);
  }
  return rows;
}

export async function importOxfordReadiness() {
  const config = await readJson(configPath);
  const source = config.sources.find((row) => row.id === "oxford_government_ai_readiness_2025");
  if (!source) throw new Error("No existe la fuente Oxford 2025 en controlled_downloads.json.");

  const startedAt = nowIso();
  const html = await fetchText(source.url, {
    headers: {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "es-ES,es;q=0.9,en;q=0.8",
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/138.0 Safari/537.36",
    },
  });
  const sourceRows = extractIndexData(html);
  const countries = await readJson(countriesPath);
  const byIso2 = new Map(countries.map((country) => [country.iso2, country]));
  const unmatched = [];
  const observations = [];

  for (const row of sourceRows) {
    const country = byIso2.get(row.code);
    if (!country) {
      unmatched.push({ code: row.code, country: row.name });
      continue;
    }
    for (const [sourceField, [metricId, metricName]] of METRICS) {
      const value = Number(row[sourceField]);
      if (!Number.isFinite(value)) continue;
      observations.push({
        iso3: country.iso3,
        iso2: country.iso2,
        country: country.country,
        region: country.region,
        income_group: country.income_group,
        year: source.year,
        sector: "gobernanza_pais",
        metric_id: metricId,
        metric_name: metricName,
        value,
        unit: "indice_0_100",
        source_id: source.id,
        source_dataset: source.dataset,
        oxford_region: Array.isArray(row.region) ? row.region.join("; ") : String(row.region ?? ""),
        oxford_income_group: Array.isArray(row.income_group) ? row.income_group.join("; ") : String(row.income_group ?? ""),
      });
    }
  }

  const coveredCountries = new Set(observations.filter((row) => row.metric_id === "government_ai_readiness").map((row) => row.iso3));
  if (coveredCountries.size < 190) {
    throw new Error(`Solo se conciliaron ${coveredCountries.size} gobiernos de Oxford con el catálogo maestro.`);
  }

  observations.sort((left, right) => left.metric_id.localeCompare(right.metric_id) || left.iso3.localeCompare(right.iso3));
  const run = {
    source_id: source.id,
    status: "ok",
    started_at: startedAt,
    completed_at: nowIso(),
    checksum_sha256: checksum(html),
    raw_path: "data/raw/oxford_government_ai_readiness_2025.html",
    source_records: sourceRows.length,
    matched_countries: coveredCountries.size,
    unmatched_countries: unmatched,
    observations: observations.length,
  };

  await writeText(rawPath, html);
  await writeJson(join(processedDirectory, "oxford_readiness_observations.json"), observations);
  await writeJson(join(processedDirectory, "oxford_readiness_run.json"), run);
  return { countries: coveredCountries.size, observations: observations.length, unmatched, run };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  importOxfordReadiness()
    .then((result) => console.log(JSON.stringify({
      ok: true,
      countries: result.countries,
      observations: result.observations,
      unmatched: result.unmatched,
    })))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
