import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { readSheet } from "read-excel-file/node";

import { fetchResource } from "./lib/http.mjs";
import { readJson, sha256Bytes, writeBytes, writeJson } from "./lib/io.mjs";
import { resolveSourceRequest } from "./lib/temporal-policy.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const rawPath = join(root, "data", "raw", "imf_aipi.xlsx");
const processedDirectory = join(root, "data", "processed");

const METRICS = [
  [3, "ai_preparedness_index", "Índice de preparación para la IA", "indice_0_1"],
  [4, "ai_digital_infrastructure", "Contribución de infraestructura digital al AIPI", "contribucion_indice_0_0_25"],
  [5, "ai_innovation_integration", "Contribución de innovación e integración económica al AIPI", "contribucion_indice_0_0_25"],
  [6, "ai_human_capital", "Contribución de capital humano y políticas laborales al AIPI", "contribucion_indice_0_0_25"],
  [7, "ai_regulation_ethics", "Contribución de regulación y ética al AIPI", "contribucion_indice_0_0_25"],
];

function nowIso() {
  return new Date().toISOString();
}

export function normalizeAipiRows(rows, source) {
  const observations = [];
  for (const row of rows.slice(2)) {
    const [country, iso3, group] = row;
    if (!country || !/^[A-Z]{3}$/.test(String(iso3))) continue;
    for (const [column, metricId, metricName, unit] of METRICS) {
      const value = Number(row[column]);
      if (!Number.isFinite(value)) continue;
      observations.push({
        iso3: String(iso3),
        country: String(country),
        year: source.year,
        sector: "preparacion_pais",
        metric_id: metricId,
        metric_name: metricName,
        value,
        unit,
        source_id: source.id,
        source_dataset: source.dataset,
        aipi_group: String(group || "Sin clasificación"),
      });
    }
  }
  return observations;
}

export async function importAipi(options = {}) {
  const asOf = options.asOf instanceof Date ? options.asOf : new Date(options.asOf ?? Date.now());
  if (Number.isNaN(asOf.getTime())) throw new TypeError("importAipi requiere asOf como fecha válida");
  const config = await readJson(join(root, "config", "controlled_downloads.json"));
  const source = config.sources.find((item) => item.id === "imf_aipi" && item.active);
  if (!source) throw new Error("La fuente controlada IMF AIPI no está activa.");

  const startedAt = nowIso();
  const request = resolveSourceRequest(source, { asOf });
  const resource = await fetchResource(request.url, {
    headers: { accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  });
  await writeBytes(rawPath, resource.bytes);

  const rows = await readSheet(rawPath, { sheet: "AIPI" });
  const observations = normalizeAipiRows(rows, source);

  if (new Set(observations.map((row) => row.iso3)).size < 160) {
    throw new Error("La descarga AIPI contiene menos de 160 países válidos.");
  }

  const completedAt = nowIso();
  const rawSha256 = sha256Bytes(resource.bytes);
  const run = {
    source_id: source.id,
    status: "ok",
    started_at: startedAt,
    completed_at: completedAt,
    policy_mode: request.policy_mode,
    edition_year: source.time_policy.edition_year,
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
    etag: resource.etag,
    last_modified: resource.lastModified,
    raw_path: "data/raw/imf_aipi.xlsx",
    records: observations.length,
    returned_min_year: source.year,
    returned_max_year: source.year,
    returned_years: [source.year],
  };
  await writeJson(join(processedDirectory, "imf_aipi_observations.json"), observations);
  await writeJson(join(processedDirectory, "imf_aipi_run.json"), run);
  return { countries: new Set(observations.map((row) => row.iso3)).size, observations: observations.length, run };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  importAipi({ asOf: process.env.OBSERVATORY_AS_OF })
    .then((result) => console.log(JSON.stringify({ ok: true, countries: result.countries, observations: result.observations })))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
