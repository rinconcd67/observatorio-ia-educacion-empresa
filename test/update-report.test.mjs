import assert from "node:assert/strict";
import test from "node:test";

import { evaluateUpdate, renderUpdateReport } from "../src/create-update-report.mjs";

function snapshot({ observations = 1_000, direct = 40, aipi = 165, oxford = 194 } = {}) {
  const rows = [];
  for (let index = 0; index < direct; index += 1) rows.push({ iso3: `D${index}`, metric_id: "enterprise_ai_adoption" });
  for (let index = 0; index < aipi; index += 1) rows.push({ iso3: `A${index}`, metric_id: "ai_preparedness_index" });
  for (let index = 0; index < oxford; index += 1) rows.push({ iso3: `O${index}`, metric_id: "government_ai_readiness" });
  while (rows.length < observations) rows.push({ iso3: "ZZZ", metric_id: "internet_users" });
  return {
    generated_at: "2026-08-01T00:00:00.000Z",
    status: "ready",
    countries: Array.from({ length: 218 }, (_, index) => ({ iso3: `C${index}` })),
    observations: rows,
    active_sources_count: 11,
    healthy_sources_count: 11,
    source_runs: [{
      source_id: "test_source",
      status: "ok",
      records: rows.length,
      raw_sha256: "a".repeat(64),
      checksum_sha256: "a".repeat(64),
      checksum_scope: "stored_file_bytes",
      policy_mode: "all_available",
    }],
  };
}

test("aprueba una actualización que conserva cobertura e integridad", () => {
  const result = evaluateUpdate(snapshot(), snapshot({ observations: 1_010 }));
  assert.equal(result.passed, true);
  assert.match(renderUpdateReport(snapshot(), snapshot()), /APROBADA PARA REVISIÓN HUMANA/);
});

test("bloquea una caída superior al diez por ciento de observaciones", () => {
  const result = evaluateUpdate(snapshot(), snapshot({ observations: 899 }));
  assert.equal(result.passed, false);
  assert.equal(result.gates.find((gate) => gate.label === "Retención mínima de observaciones").passed, false);
});

test("bloquea una regresión del año máximo observado por fuente", () => {
  const before = snapshot();
  const after = snapshot();
  before.observations.push({ iso3: "DNK", metric_id: "enterprise_ai_adoption", source_id: "test_source", year: 2025 });
  after.observations.push({ iso3: "DNK", metric_id: "enterprise_ai_adoption", source_id: "test_source", year: 2024 });

  const result = evaluateUpdate(before, after);
  assert.equal(result.passed, false);
  assert.equal(result.gates.find((gate) => gate.label === "Sin regresión del año máximo por fuente").passed, false);
});

test("bloquea un cambio silencioso de huella en una edición fijada", () => {
  const before = snapshot();
  const after = snapshot();
  before.source_runs[0].policy_mode = "pinned_edition";
  after.source_runs[0].policy_mode = "pinned_edition";
  before.source_runs[0].edition_year = 2025;
  after.source_runs[0].edition_year = 2025;
  after.source_runs[0].raw_sha256 = "b".repeat(64);

  const result = evaluateUpdate(before, after);
  assert.equal(result.passed, false);
  assert.equal(result.gates.find((gate) => gate.label === "Ediciones fijadas sin cambios silenciosos").passed, false);
});

function oxfordSnapshot() {
  const value = snapshot();
  value.source_runs[0] = {
    ...value.source_runs[0],
    source_id: "oxford_government_ai_readiness_2025",
    policy_mode: "pinned_edition",
    edition_year: 2025,
  };
  for (const row of value.observations.filter((row) => row.metric_id === "government_ai_readiness")) {
    Object.assign(row, { source_id: value.source_runs[0].source_id, year: 2025, value: 72.5 });
  }
  return value;
}

test("Oxford admite HTML distinto con estadísticas idénticas y base sin huella semántica", () => {
  const before = oxfordSnapshot();
  const after = oxfordSnapshot();
  after.source_runs[0].raw_sha256 = "b".repeat(64);
  after.observations.reverse();
  after.observations.forEach((row) => { row.country = "Etiqueta nueva"; });
  const result = evaluateUpdate(before, after);
  assert.equal(result.passed, true);
  assert.equal(result.sourceComparisons[0].rawChanged, true);
  assert.equal(result.sourceComparisons[0].pinnedChanged, false);
  assert.equal(result.sourceComparisons[0].beforeContentDigest, result.sourceComparisons[0].afterContentDigest);
  assert.match(renderUpdateReport(before, after), /observaciones: idénticas/);
});

test("Oxford bloquea correcciones estadísticas aunque se conserve la huella HTML o declarada", () => {
  const before = oxfordSnapshot();
  const after = oxfordSnapshot();
  before.source_runs[0].content_sha256 = "a".repeat(64);
  after.source_runs[0].content_sha256 = "a".repeat(64);
  after.observations.find((row) => row.metric_id === "government_ai_readiness").value = 72.6;
  const result = evaluateUpdate(before, after);
  assert.equal(result.passed, false);
  assert.equal(result.sourceComparisons[0].pinnedChanged, true);
});

test("Oxford nunca certifica snapshots vacíos, parciales, inválidos o duplicados", () => {
  for (const mutation of [
    (s) => { s.observations = s.observations.filter((row) => !row.source_id); },
    (s) => { s.observations.splice(s.observations.findIndex((row) => row.source_id), 1); },
    (s) => { s.observations.find((row) => row.source_id).value = null; },
    (s) => { s.observations.push({ ...s.observations.find((row) => row.source_id) }); },
  ]) {
    const before = oxfordSnapshot();
    const after = oxfordSnapshot();
    mutation(after);
    assert.equal(evaluateUpdate(before, after).sourceComparisons[0].pinnedChanged, true);
  }
  const empty = oxfordSnapshot();
  empty.observations = [];
  assert.equal(evaluateUpdate(empty, empty).sourceComparisons[0].pinnedChanged, true);
});


test("bloquea fuentes de línea base ausentes aunque salud y cobertura aparenten completas", () => {
  const before = snapshot();
  const after = snapshot();
  before.source_runs.push({ ...before.source_runs[0], source_id: "missing_source" });
  // Counts and all observation coverage stay healthy; only source identity exposes the loss.
  const result = evaluateUpdate(before, after);
  assert.equal(result.passed, false);
  const gate = result.gates.find((row) => row.label === "Fuentes de línea base presentes");
  assert.equal(gate.passed, false);
  assert.equal(gate.value, "missing_source");
  assert.match(renderUpdateReport(before, after), /BLOQUEADO.*Fuentes de línea base presentes.*missing_source/);
});
