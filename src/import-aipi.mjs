import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

import { fetchBytes } from "./lib/http.mjs";
import { checksum, readJson, writeJson } from "./lib/io.mjs";

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

export async function importAipi() {
  const config = await readJson(join(root, "config", "controlled_downloads.json"));
  const source = config.sources.find((item) => item.id === "imf_aipi" && item.active);
  if (!source) throw new Error("La fuente controlada IMF AIPI no está activa.");

  const startedAt = nowIso();
  const bytes = await fetchBytes(source.url);
  await mkdir(dirname(rawPath), { recursive: true });
  await writeFile(rawPath, bytes);

  const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(rawPath));
  const sheet = workbook.worksheets.getItem("AIPI");
  const values = sheet.getUsedRange().values;
  const observations = [];

  for (const row of values.slice(2)) {
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

  if (new Set(observations.map((row) => row.iso3)).size < 160) {
    throw new Error("La descarga AIPI contiene menos de 160 países válidos.");
  }

  const completedAt = nowIso();
  const run = {
    source_id: source.id,
    status: "ok",
    started_at: startedAt,
    completed_at: completedAt,
    checksum_sha256: checksum(bytes),
    raw_path: "data/raw/imf_aipi.xlsx",
    records: observations.length,
  };
  await writeJson(join(processedDirectory, "imf_aipi_observations.json"), observations);
  await writeJson(join(processedDirectory, "imf_aipi_run.json"), run);
  return { countries: new Set(observations.map((row) => row.iso3)).size, observations: observations.length, run };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  importAipi()
    .then((result) => console.log(JSON.stringify({ ok: true, countries: result.countries, observations: result.observations })))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
