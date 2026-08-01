import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const i18n = JSON.parse(await readFile(new URL("../src/dashboard/i18n.json", import.meta.url), "utf8"));

test("mantiene paridad entre los mensajes dinámicos en español e inglés", () => {
  assert.deepEqual(Object.keys(i18n.en.messages).sort(), Object.keys(i18n.es.messages).sort());
  assert.deepEqual(Object.keys(i18n.en.sourceLabels).sort(), Object.keys(i18n.es.sourceLabels).sort());
  assert.deepEqual(Object.keys(i18n.en.sourceDescriptions).sort(), Object.keys(i18n.es.sourceDescriptions).sort());
  assert.deepEqual(Object.keys(i18n.en.incomeGroups).sort(), Object.keys(i18n.es.incomeGroups).sort());
});

test("declara rutas, metadatos y documentos públicos específicos por idioma", () => {
  assert.equal(i18n.es.output, "index.html");
  assert.equal(i18n.en.output, "en/index.html");
  assert.equal(i18n.es.languageSwitchPath, "en/");
  assert.equal(i18n.en.languageSwitchPath, "../");
  assert.match(i18n.es.canonical, /\/$/);
  assert.match(i18n.en.canonical, /\/en\/$/);
  assert.equal(i18n.en.authorsFile, "authors.en.txt");
  assert.equal(i18n.en.privacyFile, "privacy.en.txt");
  assert.equal(i18n.en.dataPolicyFile, "data-policy.en.txt");
});

test("incluye traducciones estáticas y dinámicas no vacías", () => {
  assert.ok(Object.keys(i18n.en.static).length >= 130);
  for (const locale of Object.values(i18n)) {
    for (const collection of [locale.messages, locale.sourceLabels, locale.sourceDescriptions, locale.incomeGroups]) {
      assert.ok(Object.values(collection).every((value) => typeof value === "string" && value.trim().length > 0));
    }
  }
});
