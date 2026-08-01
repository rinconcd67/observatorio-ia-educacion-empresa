import assert from "node:assert/strict";
import test from "node:test";

import { decodeJsonStat } from "../src/lib/jsonstat.mjs";

test("decodifica un cubo JSON-stat disperso", () => {
  const dataset = {
    id: ["geo", "time"],
    size: [2, 2],
    dimension: {
      geo: { category: { index: { DK: 0, SE: 1 } } },
      time: { category: { index: { "2024": 0, "2025": 1 } } },
    },
    value: { "0": 10, "1": 20, "3": 40 },
  };

  assert.deepEqual(decodeJsonStat(dataset), [
    { geo: "DK", time: "2024", value: 10 },
    { geo: "DK", time: "2025", value: 20 },
    { geo: "SE", time: "2025", value: 40 },
  ]);
});

test("rechaza respuestas sin dimensiones", () => {
  assert.throws(() => decodeJsonStat({}), /JSON-stat inválida/);
});
