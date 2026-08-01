import assert from "node:assert/strict";
import test from "node:test";

import { parseCsv } from "../src/lib/csv.mjs";

test("analiza CSV con comas, comillas escapadas y saltos CRLF", () => {
  const rows = parseCsv('REF_AREA,NAME,OBS_VALUE\r\nDNK,"Denmark, total",42.1\r\nESP,"Spain ""all""",21\r\n');
  assert.deepEqual(rows, [
    { REF_AREA: "DNK", NAME: "Denmark, total", OBS_VALUE: "42.1" },
    { REF_AREA: "ESP", NAME: 'Spain "all"', OBS_VALUE: "21" },
  ]);
});
