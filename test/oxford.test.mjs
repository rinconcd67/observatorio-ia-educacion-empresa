import assert from "node:assert/strict";
import test from "node:test";

import { parseOxfordValue } from "../src/import-oxford-readiness.mjs";
import { observationDigest } from "../src/lib/observation-digest.mjs";

test("Oxford no convierte ausencias, blancos o booleanos a cero", () => {
  for (const value of [null, undefined, "", "  ", false, true, [], {}, NaN, Infinity, "missing"]) {
    assert.equal(parseOxfordValue(value), null);
  }
  assert.equal(parseOxfordValue(0), 0);
  assert.equal(parseOxfordValue("0"), 0);
  assert.equal(parseOxfordValue(" 42.25 "), 42.25);
});

test("huella semántica cambia con cualquiera de las cuatro dimensiones", () => {
  const baseline = [{ iso3: "COL", metric_id: "readiness", year: 2025, value: 50 }];
  for (const change of [{ iso3: "PER" }, { metric_id: "governance" }, { year: 2024 }, { value: 50.1 }]) {
    assert.notEqual(observationDigest(baseline), observationDigest([{ ...baseline[0], ...change }]));
  }
  assert.equal(observationDigest([]), null);
});
