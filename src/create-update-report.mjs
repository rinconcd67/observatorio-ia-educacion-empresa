import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { readJson, writeText } from "./lib/io.mjs";

const DIRECT_METRICS = new Set([
  "enterprise_ai_adoption",
  "formal_education_genai_use",
  "student_genai_use",
  "individual_genai_use",
]);

function countCountries(snapshot, predicate) {
  return new Set(snapshot.observations.filter(predicate).map((row) => row.iso3)).size;
}

export function summarizeSnapshot(snapshot) {
  return {
    generatedAt: snapshot.generated_at,
    status: snapshot.status,
    countries: snapshot.countries.length,
    observations: snapshot.observations.length,
    activeSources: snapshot.active_sources_count,
    healthySources: snapshot.healthy_sources_count,
    directCountries: countCountries(snapshot, (row) => DIRECT_METRICS.has(row.metric_id)),
    aipiCountries: countCountries(snapshot, (row) => row.metric_id === "ai_preparedness_index"),
    oxfordCountries: countCountries(snapshot, (row) => row.metric_id === "government_ai_readiness"),
  };
}

export function evaluateUpdate(before, after) {
  const baseline = summarizeSnapshot(before);
  const candidate = summarizeSnapshot(after);
  const gates = [
    [candidate.status === "ready", "Estado del snapshot", candidate.status],
    [candidate.countries >= 215, "Cobertura de países", candidate.countries],
    [candidate.observations >= baseline.observations * 0.9, "Retención mínima de observaciones", candidate.observations],
    [candidate.healthySources === candidate.activeSources, "Fuentes activas saludables", `${candidate.healthySources}/${candidate.activeSources}`],
    [candidate.directCountries >= 35, "Países con medición directa de IA", candidate.directCountries],
    [candidate.aipiCountries >= 160, "Cobertura AIPI", candidate.aipiCountries],
    [candidate.oxfordCountries >= 190, "Cobertura Oxford", candidate.oxfordCountries],
  ].map(([passed, label, value]) => ({ passed, label, value }));

  return { baseline, candidate, gates, passed: gates.every((gate) => gate.passed) };
}

function delta(after, before) {
  const value = after - before;
  return value > 0 ? `+${value}` : String(value);
}

export function renderUpdateReport(before, after) {
  const evaluation = evaluateUpdate(before, after);
  const { baseline, candidate, gates } = evaluation;
  const sourceRows = after.source_runs
    .map((run) => `| ${run.source_id} | ${run.status} | ${run.records ?? run.observations ?? "-"} |`)
    .join("\n");
  const gateRows = gates
    .map((gate) => `| ${gate.passed ? "APROBADO" : "BLOQUEADO"} | ${gate.label} | ${gate.value} |`)
    .join("\n");

  return `# Informe de actualización del observatorio

**Decisión automática:** ${evaluation.passed ? "APROBADA PARA REVISIÓN HUMANA" : "BLOQUEADA"}

La automatización valida integridad y cobertura, pero no autoriza por sí sola la publicación. Los cambios deben revisarse e integrarse mediante pull request.

## Comparación

| Indicador | Línea base | Candidato | Variación |
|---|---:|---:|---:|
| Países y economías | ${baseline.countries} | ${candidate.countries} | ${delta(candidate.countries, baseline.countries)} |
| Observaciones | ${baseline.observations} | ${candidate.observations} | ${delta(candidate.observations, baseline.observations)} |
| Fuentes activas | ${baseline.activeSources} | ${candidate.activeSources} | ${delta(candidate.activeSources, baseline.activeSources)} |
| Fuentes saludables | ${baseline.healthySources} | ${candidate.healthySources} | ${delta(candidate.healthySources, baseline.healthySources)} |
| Medición directa de IA | ${baseline.directCountries} | ${candidate.directCountries} | ${delta(candidate.directCountries, baseline.directCountries)} |
| AIPI | ${baseline.aipiCountries} | ${candidate.aipiCountries} | ${delta(candidate.aipiCountries, baseline.aipiCountries)} |
| Oxford | ${baseline.oxfordCountries} | ${candidate.oxfordCountries} | ${delta(candidate.oxfordCountries, baseline.oxfordCountries)} |

## Controles de aceptación

| Resultado | Control | Valor observado |
|---|---|---:|
${gateRows}

## Estado de las fuentes

| Fuente | Estado | Registros informados |
|---|---|---:|
${sourceRows}

## Trazabilidad

- Línea base: ${baseline.generatedAt}
- Candidato: ${candidate.generatedAt}
- Autor responsable: César David Rincón Godoy
- ORCID: https://orcid.org/0009-0003-2112-3851
`;
}

async function main() {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const [beforePath, afterPath, outputPath] = process.argv.slice(2);
  if (!beforePath || !afterPath || !outputPath) {
    throw new Error("Uso: node src/create-update-report.mjs <antes.json> <después.json> <informe.md>");
  }

  const [before, after] = await Promise.all([
    readJson(resolve(root, beforePath)),
    readJson(resolve(root, afterPath)),
  ]);
  const evaluation = evaluateUpdate(before, after);
  await writeText(resolve(root, outputPath), renderUpdateReport(before, after));
  if (!evaluation.passed) {
    throw new Error("La actualización no superó los controles de aceptación.");
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
