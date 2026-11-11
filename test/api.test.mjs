import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const siteEs = await readFile(join(root, "_site", "index.html"), "utf8");
const siteEn = await readFile(join(root, "_site", "en", "index.html"), "utf8");

test("la API REST estática v1 genera el índice general y catálogo de países", async () => {
  const indexPath = join(root, "_site", "api", "v1", "index.json");
  const countriesPath = join(root, "_site", "api", "v1", "countries.json");

  assert.ok((await stat(indexPath)).isFile(), "Falta api/v1/index.json");
  assert.ok((await stat(countriesPath)).isFile(), "Falta api/v1/countries.json");

  const index = JSON.parse(await readFile(indexPath, "utf8"));
  assert.equal(index.schema_version, "1.0.0");
  assert.equal(index.version, "0.5.0");
  assert.equal(index.author.orcid, "https://orcid.org/0009-0003-2112-3851");
  assert.equal(index.citation.doi, "10.5281/zenodo.24140002");
  assert.equal(index.coverage.total_countries, 218);
  assert.ok(index.documentation.endpoints.countries_catalog);
  assert.ok(index.documentation.endpoints.country_dossier_template);

  const countries = JSON.parse(await readFile(countriesPath, "utf8"));
  assert.equal(countries.total_countries, 218);
  assert.equal(countries.countries.length, 218);
  for (const c of countries.countries) {
    assert.match(c.iso3, /^[A-Z]{3}$/);
    assert.ok(c.endpoint.startsWith("/api/v1/countries/"));
    assert.ok(c.url.includes(`/countries/${c.iso3}.json`));
  }
});

test("los endpoints por país exponen expedientes normalizados 360° con citación y metadatos", async () => {
  for (const iso3 of ["COL", "CHL", "BRA", "ESP", "USA"]) {
    const filePath = join(root, "_site", "api", "v1", "countries", `${iso3}.json`);
    assert.ok((await stat(filePath)).isFile(), `Falta endpoint para ${iso3}`);

    const data = JSON.parse(await readFile(filePath, "utf8"));
    assert.equal(data.country.iso3, iso3);
    assert.equal(data.version, "0.5.0");
    assert.ok(data.macro_indicators.oxford_government_ai_readiness_2025);
    assert.ok(data.sectoral_ai_adoption);
    assert.ok(data.national_ai_strategy, `Falta estrategia ENIA para ${iso3}`);
    assert.equal(data.author.name, "César David Rincón Godoy");
    assert.equal(data.citation.doi, "10.5281/zenodo.24140002");
    assert.equal(data.citation.license, "https://creativecommons.org/licenses/by/4.0/");
  }
});

test("el endpoint de taxonomía de riesgos de IA cubre los cuatro niveles regulatorios", async () => {
  const taxPath = join(root, "_site", "api", "v1", "risk-taxonomy.json");
  assert.ok((await stat(taxPath)).isFile(), "Falta api/v1/risk-taxonomy.json");

  const tax = JSON.parse(await readFile(taxPath, "utf8"));
  assert.equal(tax.categories.length, 4);
  const ids = tax.categories.map((c) => c.id);
  assert.ok(ids.includes("unacceptable_risk"));
  assert.ok(ids.includes("high_risk_education"));
  assert.ok(ids.includes("high_risk_employment"));
  assert.ok(ids.includes("transparency_risk_genai"));

  for (const c of tax.categories) {
    assert.ok(c.title_es && c.title_en);
    assert.ok(c.education_es && c.education_en);
    assert.ok(c.business_es && c.business_en);
    assert.ok(c.legal_basis.length > 0);
  }
});

test("la interfaz pública integra la banda de taxonomía de riesgo y enlace a la API REST", () => {
  for (const html of [siteEs, siteEn]) {
    assert.ok(html.includes('id="risk-taxonomy-section"'), "Falta risk-taxonomy-section en HTML");
    assert.ok(html.includes('id="risk-taxonomy-grid"'), "Falta risk-taxonomy-grid en HTML");
    assert.ok(html.includes("api/v1/index.json"), "Falta enlace a la API REST en download-actions");
    assert.ok(html.includes("function renderRiskTaxonomy()"), "Falta renderRiskTaxonomy en app.js");
  }
});
