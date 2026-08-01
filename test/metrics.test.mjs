import assert from "node:assert/strict";
import test from "node:test";

import { latestBy, mean, round } from "../src/lib/metrics.mjs";

test("calcula promedios solo con valores numéricos", () => {
  assert.equal(mean([10, null, 20, Number.NaN]), 15);
  assert.equal(mean([null, Number.NaN]), null);
});

test("selecciona el último año por clave", () => {
  const rows = [
    { iso3: "DNK", year: 2023, value: 1 },
    { iso3: "DNK", year: 2025, value: 2 },
    { iso3: "SWE", year: 2024, value: 3 },
  ];
  assert.deepEqual(latestBy(rows, ["iso3"]), [
    { iso3: "DNK", year: 2025, value: 2 },
    { iso3: "SWE", year: 2024, value: 3 },
  ]);
});

test("redondea de forma determinista", () => {
  assert.equal(round(12.3456), 12.35);
  assert.equal(round(null), null);
});
