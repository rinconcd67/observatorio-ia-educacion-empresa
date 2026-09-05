import assert from "node:assert/strict";
import test from "node:test";

import { latestBy, latestByPriority, latestCommonYearPairs, mean, quantile, round } from "../src/lib/metrics.mjs";

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

test("resuelve coincidencias del mismo año según la precedencia de fuente", () => {
  const rows = [
    { iso3: "DNK", year: 2025, value: 40, source_id: "oecd" },
    { iso3: "DNK", year: 2025, value: 42, source_id: "eurostat" },
  ];
  assert.deepEqual(latestByPriority(rows, ["iso3"], { eurostat: 20, oecd: 10 }), [rows[1]]);
});

test("calcula cuantiles sobre valores numéricos ordenados", () => {
  const values = [0.8, null, 0.2, 0.6, 0.4, Number.NaN];
  assert.equal(quantile(values, 0.25), 0.4);
  assert.equal(quantile(values, 0.5), 0.6);
  assert.equal(quantile([], 0.5), null);
});

test("selecciona el último año común después de resolver la prioridad por país y año", () => {
  const businessRows = [
    { iso3: "CHE", year: 2023, value: 9, source_id: "oecd" },
    { iso3: "CHE", year: 2023, value: 10, source_id: "eurostat" },
    { iso3: "CHE", year: 2024, value: 12, source_id: "oecd" },
  ];
  const educationRows = [
    { iso3: "CHE", year: 2023, value: 18, source_id: "eurostat_education" },
    { iso3: "CHE", year: 2025, value: 20, source_id: "eurostat_education" },
  ];

  const pairs = latestCommonYearPairs(
    businessRows,
    educationRows,
    ["iso3"],
    { eurostat: 20, oecd: 10 },
  );

  assert.equal(pairs.length, 1);
  assert.equal(pairs[0].year, 2023);
  assert.equal(pairs[0].left.value, 10);
  assert.equal(pairs[0].left.source_id, "eurostat");
  assert.equal(pairs[0].right.value, 18);
});
