import assert from "node:assert/strict";
import test from "node:test";

import { normalizeAipiRows } from "../src/import-aipi.mjs";

test("normaliza una fila AIPI sin dependencia del entorno local", () => {
  const rows = [
    ["encabezado"],
    ["encabezado secundario"],
    ["Colombia", "COL", "EM", 0.5, 0.1, 0.12, 0.13, 0.15],
  ];
  const source = { id: "imf_aipi", dataset: "aipidata.xlsx", year: 2023 };
  const observations = normalizeAipiRows(rows, source);
  assert.equal(observations.length, 5);
  assert.equal(observations[0].iso3, "COL");
  assert.equal(observations[0].metric_id, "ai_preparedness_index");
  assert.equal(observations[0].value, 0.5);
  assert.equal(observations[4].metric_id, "ai_regulation_ethics");
});
