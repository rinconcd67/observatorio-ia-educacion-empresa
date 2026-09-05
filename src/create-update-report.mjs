import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { observationDigest } from "./lib/observation-digest.mjs";
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

function runDigest(run) {
  return run?.raw_sha256 ?? run?.checksum_sha256 ?? null;
}

function observedYearRange(snapshot, sourceId) {
  const years = snapshot.observations
    .filter((row) => row.source_id === sourceId && Number.isInteger(row.year))
    .map((row) => row.year);
  return {
    min: years.length ? Math.min(...years) : null,
    max: years.length ? Math.max(...years) : null,
  };
}

function requestedWindow(run) {
  if (Number.isInteger(run?.edition_year)) return `edición ${run.edition_year}`;
  const start = run?.requested_start_year ?? "abierto";
  const end = run?.requested_end_year ?? "abierto";
  return `${start}–${end}`;
}

export function compareSourceRuns(before, after) {
  const beforeRuns = new Map(before.source_runs.map((run) => [run.source_id, run]));
  return after.source_runs.map((run) => {
    const baseline = beforeRuns.get(run.source_id);
    const beforeRange = observedYearRange(before, run.source_id);
    const afterRange = observedYearRange(after, run.source_id);
    const beforeMaxYear = baseline?.returned_max_year ?? beforeRange.max;
    const afterMaxYear = run.returned_max_year ?? afterRange.max;
    const regressed = Number.isInteger(beforeMaxYear)
      && Number.isInteger(afterMaxYear)
      && afterMaxYear < beforeMaxYear;
    const usesObservationDigest = run.source_id === "oxford_government_ai_readiness_2025";
    // Recompute both digests from evidence, including legacy snapshots without a content hash.
    const beforeContentDigest = usesObservationDigest
      ? observationDigest(before.observations.filter((row) => row.source_id === run.source_id)) : null;
    const afterContentDigest = usesObservationDigest
      ? observationDigest(after.observations.filter((row) => row.source_id === run.source_id)) : null;
    const contentInvalid = usesObservationDigest && (!beforeContentDigest || !afterContentDigest);
    const pinnedChanged = usesObservationDigest
      ? Boolean(contentInvalid || beforeContentDigest !== afterContentDigest)
      : run.policy_mode === "pinned_edition"
      && baseline
      && runDigest(baseline)
      && runDigest(run)
      && runDigest(baseline) !== runDigest(run);
    return {
      sourceId: run.source_id,
      status: run.status,
      records: run.records ?? run.observations ?? "-",
      window: requestedWindow(run),
      beforeMaxYear,
      afterMaxYear,
      regressed,
      pinnedChanged,
      contentInvalid,
      beforeContentDigest,
      afterContentDigest,
      rawChanged: Boolean(baseline && runDigest(baseline) !== runDigest(run)),
      exactFileDigest: run.status === "ok"
        ? run.checksum_scope === "stored_file_bytes" && /^[a-f0-9]{64}$/.test(runDigest(run) ?? "")
        : null,
    };
  });
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
  const sourceComparisons = compareSourceRuns(before, after);
  const candidateSourceIds = new Set(after.source_runs.map((run) => run.source_id));
  const missingSources = [...new Set(before.source_runs.map((run) => run.source_id))]
    .filter((sourceId) => !candidateSourceIds.has(sourceId));
  const regressions = sourceComparisons.filter((source) => source.regressed).map((source) => source.sourceId);
  const pinnedChanges = sourceComparisons.filter((source) => source.pinnedChanged).map((source) => source.sourceId);
  const successfulSources = sourceComparisons.filter((source) => source.status === "ok");
  const exactDigests = successfulSources.filter((source) => source.exactFileDigest).length;
  const gates = [
    [candidate.status === "ready", "Estado del snapshot", candidate.status],
    [missingSources.length === 0, "Fuentes de línea base presentes", missingSources.length ? missingSources.join(", ") : "sin fuentes ausentes"],
    [candidate.countries >= 215, "Cobertura de países", candidate.countries],
    [candidate.observations >= baseline.observations * 0.9, "Retención mínima de observaciones", candidate.observations],
    [candidate.healthySources === candidate.activeSources, "Fuentes activas saludables", `${candidate.healthySources}/${candidate.activeSources}`],
    [candidate.directCountries >= 35, "Países con medición directa de IA", candidate.directCountries],
    [candidate.aipiCountries >= 160, "Cobertura AIPI", candidate.aipiCountries],
    [candidate.oxfordCountries >= 190, "Cobertura Oxford", candidate.oxfordCountries],
    [regressions.length === 0, "Sin regresión del año máximo por fuente", regressions.length ? regressions.join(", ") : "0 regresiones"],
    [pinnedChanges.length === 0, "Ediciones fijadas sin cambios silenciosos", pinnedChanges.length ? pinnedChanges.join(", ") : "sin cambios"],
    [exactDigests === successfulSources.length, "Huellas SHA-256 de archivos exactos", `${exactDigests}/${successfulSources.length}`],
  ].map(([passed, label, value]) => ({ passed, label, value }));

  return { baseline, candidate, sourceComparisons, gates, passed: gates.every((gate) => gate.passed) };
}

function delta(after, before) {
  const value = after - before;
  return value > 0 ? `+${value}` : String(value);
}

export function renderUpdateReport(before, after) {
  const evaluation = evaluateUpdate(before, after);
  const { baseline, candidate, sourceComparisons, gates } = evaluation;
  const sourceRows = sourceComparisons
    .map((source) => `| ${source.sourceId} | ${source.window} | ${source.beforeMaxYear ?? "-"} | ${source.afterMaxYear ?? "-"} | ${source.records} | ${source.status} | ${source.status !== "ok" || source.regressed || source.pinnedChanged || source.exactFileDigest === false ? "BLOQUEADO" : "APROBADO"} |`)
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

| Fuente | Ventana solicitada | Máx. anterior | Máx. candidato | Registros | Estado | Decisión |
|---|---|---:|---:|---:|---|---|
${sourceRows}

## Cambios de contenido Oxford

${sourceComparisons.filter((source) => source.sourceId === "oxford_government_ai_readiness_2025").map((source) => `- HTML: ${source.rawChanged ? "huella modificada" : "huella conservada"}; observaciones: ${source.contentInvalid ? "comparación inválida o vacía" : source.pinnedChanged ? "cambio estadístico; requiere revisión" : "idénticas"}.\n- SHA-256 semántico anterior: ${source.beforeContentDigest ?? "no disponible"}\n- SHA-256 semántico candidato: ${source.afterContentDigest ?? "no disponible"}`).join("\n")}

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

  if (resolve(root, beforePath) === resolve(root, afterPath)) {
    throw new Error("La línea base y el candidato deben ser archivos distintos.");
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
