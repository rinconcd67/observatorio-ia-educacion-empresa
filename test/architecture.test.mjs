import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const siteEs = await readFile(join(root, "_site", "index.html"), "utf8");
const siteEn = await readFile(join(root, "_site", "en", "index.html"), "utf8");

test("la navegación agrupa las vistas en los cuatro pilares arquitectónicos y metanavegación en ES y EN", () => {
  for (const label of ["Panorama", "Sectores", "Perfil 360°", "Recursos", "Método"]) {
    assert.ok(siteEs.includes(`<span class="pillar-label">${label}</span>`), `Falta pilar ES: ${label}`);
  }
  for (const label of ["Overview", "Sectors", "360° Profile", "Resources", "Method"]) {
    assert.ok(siteEn.includes(`<span class="pillar-label">${label}</span>`), `Missing EN pillar: ${label}`);
  }
});

test("en la vista Global el explorador de datos precede al hub de capas y el panel de noticias inicia colapsado", () => {
  for (const html of [siteEs, siteEn]) {
    const portalIdx = html.indexOf('id="editorial-portal"');
    const explorerIdx = html.indexOf('id="data-explorer"');
    const mapIdx = html.indexOf('id="world-map"');
    const hubIdx = html.indexOf('id="ecosystem-hub"');
    assert.ok(portalIdx > 0 && explorerIdx > portalIdx, "data-explorer debe seguir a editorial-portal");
    assert.ok(mapIdx > explorerIdx && hubIdx > mapIdx, "ecosystem-hub debe ubicarse después del mapa y gráficos globales");
    assert.ok(html.includes("showNews(false);"), "El radar de noticias debe iniciar colapsado bajo demanda");
  }
});

test("en la vista Educación los gráficos principales preceden al explorador por pestañas de América Latina", () => {
  for (const html of [siteEs, siteEn]) {
    const barsIdx = html.indexOf('id="education-bars"');
    const individualIdx = html.indexOf('id="individual-bars"');
    const explorerIdx = html.indexOf('id="lac-layers-explorer"');
    const tabsIdx = html.indexOf('id="lac-layer-tabs"');
    assert.ok(barsIdx > 0 && individualIdx > barsIdx, "Los gráficos principales deben preceder al explorador regional");
    assert.ok(explorerIdx > individualIdx && tabsIdx > explorerIdx, "El explorador por pestañas debe seguir a los gráficos");
    for (const tab of ["education-evidence", "cima-context", "education-finance", "cepal-context", "all"]) {
      assert.ok(html.includes(`data-lac-tab="${tab}"`), `Falta pestaña regional: ${tab}`);
    }
  }
});

test("la vista Países incorpora el Expediente 360° con cruce de catálogos y capas regionales", () => {
  for (const html of [siteEs, siteEn]) {
    assert.ok(html.includes('id="country-360-band"'), "Falta la banda country-360-band");
    assert.ok(html.includes('id="country-360-dossier"'), "Falta el contenedor country-360-dossier");
    assert.ok(html.includes("window.OBSERVATORY_LIBRARY="), "Falta el catálogo de biblioteca en runtime");
    assert.ok(html.includes("window.OBSERVATORY_SKILLS="), "Falta el catálogo de skills en runtime");
    assert.ok(html.includes("function renderCountryDossier(row)"), "Falta renderCountryDossier en app.js");
  }
});

test("integra las 5 mejoras de Stanford HAI, tabla comparativa e indexación Google Scholar y Dataset Search", async () => {
  for (const html of [siteEs, siteEn]) {
    assert.ok(html.includes('name="citation_title"'), "Falta meta tag Highwire Press citation_title para Google Scholar");
    assert.ok(html.includes('name="citation_author_orcid" content="https://orcid.org/0009-0003-2112-3851"'), "Falta ORCID en meta tag citation_author_orcid");
    assert.ok(html.includes('"@type":["WebApplication","Dataset"]'), "El JSON-LD debe declarar WebApplication y Dataset para Google Dataset Search");
    assert.ok(html.includes("DataDownload"), "El JSON-LD debe incluir distribuciones DataDownload");
    assert.ok(html.includes("international-benchmark"), "Falta la tabla comparativa de observatorios internacionales");
    assert.ok(html.includes("hcai-glossary"), "Falta el glosario crítico HCAI");
    assert.ok(html.includes("gvt-weights-simulator"), "Falta el simulador de ponderación por pilares estilo Stanford GVT");
    assert.ok(html.includes("country-policy-brief-sheet"), "Falta el generador de Policy Brief nacional");
    assert.ok(html.includes("scholar-indexing-hub"), "Falta el hub de exportación BibTeX y RIS para Google Scholar");
  }
  assert.ok((await stat(join(root, "_site", "data", "citation.bib"))).isFile(), "Falta archivo descargable citation.bib");
  assert.ok((await stat(join(root, "_site", "data", "citation.ris"))).isFile(), "Falta archivo descargable citation.ris");
  assert.ok((await stat(join(root, "_site", "biblioteca", "stanford-hai-ai-index-2026", "index.html"))).isFile(), "Falta ficha ES de Stanford AI Index 2026");
  assert.ok((await stat(join(root, "_site", "en", "library", "stanford-hai-ai-index-2026", "index.html"))).isFile(), "Falta ficha EN de Stanford AI Index 2026");
  assert.ok((await stat(join(root, "_site", "biblioteca", "stanford-hai-global-vibrancy-tool-2025", "index.html"))).isFile(), "Falta ficha ES de Stanford Global Vibrancy Tool");
});
