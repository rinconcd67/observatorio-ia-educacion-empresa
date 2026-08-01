import assert from "node:assert/strict";
import test from "node:test";

import { publicAssetPath } from "../src/lib/site-path.mjs";

test("resuelve índices de las rutas públicas bilingües", () => {
  assert.equal(publicAssetPath("/"), "index.html");
  assert.equal(publicAssetPath("/en/"), "en/index.html");
  assert.equal(publicAssetPath("/en/?view=countries&country=COL"), "en/index.html");
});

test("conserva rutas directas de datos y recursos", () => {
  assert.equal(publicAssetPath("/data/status.json"), "data/status.json");
  assert.equal(publicAssetPath("/social-preview-en.png"), "social-preview-en.png");
});
