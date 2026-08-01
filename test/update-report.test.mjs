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
    source_runs: [{ source_id: "test_source", status: "ok", records: rows.length }],
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
