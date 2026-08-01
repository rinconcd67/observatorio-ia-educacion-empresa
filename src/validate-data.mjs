import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";

import { checksum, readJson } from "./lib/io.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function validateSnapshot(snapshot) {
  assert(snapshot.status === "ready", "El snapshot no está en estado ready.");
  assert(snapshot.observations.length > 900, "El snapshot contiene muy pocas observaciones para la cobertura ampliada.");
  const requiredSources = new Set([
    "eurostat_enterprise_ai",
    "eurostat_formal_education_ai",
    "eurostat_student_ai",
    "world_bank_countries",
  ]);
  assert(
    snapshot.source_runs.filter((run) => requiredSources.has(run.source_id)).every((run) => run.status === "ok"),
    "Existe al menos una fuente esencial con error.",
  );

  const countryCodes = new Set();
  for (const country of snapshot.countries) {
    assert(/^[A-Z]{3}$/.test(country.iso3), `Código ISO3 inválido: ${country.iso3}`);
    assert(!countryCodes.has(country.iso3), `País duplicado: ${country.iso3}`);
    countryCodes.add(country.iso3);
  }

  const directMetrics = new Set([
    "enterprise_ai_adoption",
    "formal_education_genai_use",
    "student_genai_use",
    "individual_genai_use",
  ]);
  const aipiMetrics = new Set(["ai_preparedness_index"]);
  const aipiComponents = new Set([
    "ai_digital_infrastructure",
    "ai_innovation_integration",
    "ai_human_capital",
    "ai_regulation_ethics",
  ]);
  const oxfordMetrics = new Set([
    "government_ai_readiness",
    "government_policy_capacity",
    "government_ai_infrastructure",
    "government_ai_governance",
    "government_public_sector_adoption",
    "government_development_diffusion",
    "government_ai_resilience",
  ]);
  const directCountries = new Set();
  const aipiCountries = new Set();
  const oxfordCountries = new Set();
  const observationKeys = new Set();
  for (const row of snapshot.observations) {
    assert(Number.isFinite(row.value), `Valor no numérico en ${row.metric_id}/${row.iso3}.`);
    assert(countryCodes.has(row.iso3), `Observación sin país maestro: ${row.iso3}.`);
    assert(Number.isInteger(row.year), `Año inválido en ${row.metric_id}/${row.iso3}.`);
    const observationKey = [row.source_id, row.metric_id, row.iso3, row.year, row.unit].join("|");
    assert(!observationKeys.has(observationKey), `Observación duplicada: ${observationKey}.`);
    observationKeys.add(observationKey);
    if (directMetrics.has(row.metric_id)) {
      assert(row.value >= 0 && row.value <= 100, `Porcentaje fuera de rango en ${row.metric_id}/${row.iso3}.`);
      directCountries.add(row.iso3);
    }
    if (aipiMetrics.has(row.metric_id)) {
      assert(row.value >= 0 && row.value <= 1, `Índice AIPI fuera de rango en ${row.iso3}.`);
      aipiCountries.add(row.iso3);
    }
    if (aipiComponents.has(row.metric_id)) {
      assert(row.value >= 0 && row.value <= 0.25, `Contribución AIPI fuera de rango en ${row.metric_id}/${row.iso3}.`);
    }
    if (oxfordMetrics.has(row.metric_id)) {
      assert(row.value >= 0 && row.value <= 100, `Índice Oxford fuera de rango en ${row.metric_id}/${row.iso3}.`);
      if (row.metric_id === "government_ai_readiness") oxfordCountries.add(row.iso3);
    }
  }
  assert(directCountries.size >= 35, "La cobertura directa de IA es inferior a 35 países.");
  assert(aipiCountries.size >= 160, "La cobertura AIPI es inferior a 160 países.");
  assert(oxfordCountries.size >= 190, "La cobertura Oxford 2025 es inferior a 190 países.");
  assert(snapshot.healthy_sources_count === snapshot.active_sources_count, "No todas las fuentes activas están operativas.");
  return {
    countries: snapshot.countries.length,
    observations: snapshot.observations.length,
    directCountries: directCountries.size,
    aipiCountries: aipiCountries.size,
    oxfordCountries: oxfordCountries.size,
  };
}

export function validateArtifact(artifact) {
  assert(artifact.surface === "dashboard", "El artefacto no declara surface=dashboard.");
  assert(artifact.snapshot.status === "ready", "El artefacto no está listo.");
  assert(artifact.manifest.blocks.length >= 6, "El dashboard no tiene suficiente estructura analítica.");
  assert(artifact.manifest.cards.every((card) => card.sourceId || card.source), "Existe una tarjeta sin procedencia.");
  assert(artifact.manifest.charts.every((chart) => chart.sourceId || chart.source), "Existe un gráfico sin procedencia.");
  assert(artifact.manifest.tables.every((table) => table.sourceId || table.source), "Existe una tabla sin procedencia.");
  assert(artifact.manifest.version === 3, "El manifiesto no corresponde a la versión 0.3.");
  assert(artifact.snapshot.version === 3, "El snapshot del artefacto no corresponde a la versión 0.3.");
  assert(artifact.snapshot.datasets.country_profile.length >= 215, "La tabla país tiene cobertura insuficiente.");
  assert(artifact.snapshot.datasets.regional_summary.length === 7, "La síntesis regional no contiene siete regiones.");
  assert(artifact.snapshot.datasets.global_summary[0].aipi_countries >= 160, "La síntesis global AIPI tiene cobertura insuficiente.");
  assert(artifact.snapshot.datasets.global_summary[0].government_readiness_countries >= 190, "La síntesis global Oxford tiene cobertura insuficiente.");
  assert(!JSON.stringify(artifact).includes('"fixture"'), "El artefacto contiene datos de prueba.");
  return {
    blocks: artifact.manifest.blocks.length,
    cards: artifact.manifest.cards.length,
    charts: artifact.manifest.charts.length,
    tables: artifact.manifest.tables.length,
  };
}

export function validateDashboardHtml(html) {
  assert(html.includes("Observatorio Global de IA"), "El HTML no contiene la identidad v0.3.");
  assert(html.includes('id="world-map"'), "El HTML no contiene el mapa mundial.");
  assert((html.match(/data-view="/g) ?? []).length === 8, "El HTML no contiene ocho vistas temáticas.");
  assert(html.includes('data-view="about"'), "El HTML no contiene la vista de autoría.");
  assert(html.includes("0009-0003-2112-3851"), "El HTML no contiene el ORCID del autor.");
  assert(html.includes('aria-label="Abrir navegación"'), "El menú móvil no tiene nombre accesible.");
  assert(html.includes('rel="canonical"'), "El HTML no contiene URL canónica.");
  assert(html.includes('type="application/ld+json"'), "El HTML no contiene metadatos estructurados.");
  assert(html.includes("data/observations.csv"), "El HTML no ofrece descarga CSV.");
  assert(html.includes(".control-row label { flex: 1 1 0; min-width: 0; }"), "El HTML no protege los controles contra desbordamiento móvil.");
  assert(html.includes("window.OBSERVATORY_ARTIFACT="), "El HTML no contiene el contrato analítico incrustado.");
  assert(html.includes("window.OBSERVATORY_GEOJSON="), "El HTML no contiene la geometría mundial incrustada.");
  assert(!/<script[^>]+src=/i.test(html), "El HTML depende de scripts externos.");
  assert(!/<link[^>]+rel=["']stylesheet/i.test(html), "El HTML depende de hojas de estilo externas.");
  return { bytes: Buffer.byteLength(html), views: 8, selfContained: true };
}

export function validateSite(siteHtml, status, csv, artifact, socialPreview) {
  assert(siteHtml === dashboardHtml, "El sitio público no coincide con el dashboard canónico.");
  assert(status.version === "0.3.1", "El sitio público no corresponde a la versión 0.3.1.");
  assert(status.status === "ready", "El estado público no está listo.");
  assert(status.countries === artifact.snapshot.datasets.country_profile.length, "El estado público no coincide en países.");
  assert(status.artifact_sha256 === checksum(artifact), "El checksum público del artefacto no coincide.");
  assert(csv.split("\n").filter(Boolean).length === snapshot.observations.length + 1, "El CSV público no contiene todas las observaciones.");
  assert(csv.startsWith("iso3,iso2,country,region"), "El CSV público no tiene el encabezado esperado.");
  assert(socialPreview.length > 50_000, "La imagen social pública está vacía o incompleta.");
  assert(socialPreview.subarray(1, 4).toString("ascii") === "PNG", "La imagen social pública no es PNG.");
  return {
    version: status.version,
    csvRows: snapshot.observations.length,
    status: status.status,
    socialPreviewBytes: socialPreview.length,
  };
}

const snapshot = await readJson(join(root, "data", "processed", "snapshot.json"));
const artifact = await readJson(join(root, "dashboard", "artifact.json"));
const dashboardHtml = await readFile(join(root, "dashboard", "index.html"), "utf8");
const siteHtml = await readFile(join(root, "_site", "index.html"), "utf8");
const siteStatus = await readJson(join(root, "_site", "data", "status.json"));
const siteCsv = await readFile(join(root, "_site", "data", "observations.csv"), "utf8");
const socialPreview = await readFile(join(root, "_site", "social-preview.png"));
console.log(JSON.stringify({
  ok: true,
  snapshot: validateSnapshot(snapshot),
  artifact: validateArtifact(artifact),
  dashboard: validateDashboardHtml(dashboardHtml),
  site: validateSite(siteHtml, siteStatus, siteCsv, artifact, socialPreview),
}));
