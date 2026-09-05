import { mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { readJson, writeText } from "./lib/io.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const templateDirectory = join(root, "src", "dashboard");
const dashboardDirectory = join(root, "dashboard");

function safeJson(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function translateTextNodes(shell, translations) {
  return shell.replace(/>([^<>]+)</g, (match, content) => {
    const trimmed = content.trim();
    if (!trimmed || /^__[A-Z0-9_]+__$/.test(trimmed) || trimmed.includes("__OBSERVATORY_")) return match;
    const translated = translations[trimmed];
    if (translated === undefined) {
      throw new Error(`Falta traducción estática para: ${trimmed}`);
    }
    return `>${content.replace(trimmed, translated)}<`;
  });
}

function translateAttributes(shell, locale) {
  const attributes = locale === "en" ? {
    "Observatorio Global de IA": "Global AI Observatory",
    "Abrir navegación": "Open navigation",
    "Vistas del observatorio": "Observatory views",
    "Mapa mundial por indicador": "World map by indicator",
    "País o región": "Country or region",
  } : {};
  return shell.replace(/\b(aria-label|title|placeholder)="([^"]+)"/g, (match, name, value) => {
    return `${name}="${attributes[value] ?? value}"`;
  });
}

function structuredData(locale, version) {
  const spanish = locale.htmlLang === "es";
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: locale.pageTitle,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    inLanguage: locale.htmlLang,
    version,
    author: {
      "@type": "Person",
      name: "César David Rincón Godoy",
      identifier: "https://orcid.org/0009-0003-2112-3851",
      url: "https://cesar-rincon-profile.rinconcd67.chatgpt.site",
      affiliation: { "@type": "CollegeOrUniversity", name: "Broward International University" },
    },
    about: spanish
      ? ["Inteligencia artificial", "Educación", "Empresa", "Gobernanza"]
      : ["Artificial intelligence", "Education", "Business", "Governance"],
    isAccessibleForFree: true,
  };
}

function renderLocale(shell, css, javascript, artifact, geojson, i18n, localeName, version) {
  const locale = i18n[localeName];
  const runtimeI18n = Object.fromEntries(
    Object.entries(i18n).map(([name, configuration]) => [name, { ...configuration, static: undefined }]),
  );
  const localizedShell = localeName === "en"
    ? translateAttributes(translateTextNodes(shell, locale.static), localeName)
    : shell;
  return localizedShell
    .replaceAll("__LIBRARY_PATH__", localeName === "es" ? "biblioteca/" : "library/")
    .replaceAll("__TOPICS_PATH__", localeName === "es" ? "temas/" : "topics/")
    .replaceAll("__PACKAGE_VERSION__", version)
    .replaceAll("__HTML_LANG__", locale.htmlLang)
    .replaceAll("__PAGE_TITLE__", locale.pageTitle)
    .replaceAll("__META_DESCRIPTION__", locale.metaDescription)
    .replaceAll("__CANONICAL_URL__", locale.canonical)
    .replaceAll("__OG_LOCALE__", locale.ogLocale)
    .replaceAll("__OG_DESCRIPTION__", locale.ogDescription)
    .replaceAll("__OG_IMAGE__", locale.ogImage)
    .replaceAll("__ASSET_PREFIX__", locale.assetPrefix)
    .replaceAll("__MANIFEST__", locale.manifest)
    .replaceAll("__LANGUAGE_SWITCH_PATH__", locale.languageSwitchPath)
    .replaceAll("__LANGUAGE_SWITCH_TEXT__", locale.languageSwitchText)
    .replaceAll("__LANGUAGE_SWITCH_LABEL__", locale.languageSwitchLabel)
    .replaceAll("__AUTHORS_FILE__", locale.authorsFile)
    .replaceAll("__PRIVACY_FILE__", locale.privacyFile)
    .replaceAll("__DATA_POLICY_FILE__", locale.dataPolicyFile)
    .replace("__STRUCTURED_DATA__", safeJson(structuredData(locale, version)))
    .replace("__OBSERVATORY_CSS__", css)
    .replace("__OBSERVATORY_DATA__", safeJson(artifact))
    .replace("__OBSERVATORY_GEOJSON__", safeJson(geojson))
    .replace("__OBSERVATORY_I18N__", safeJson(runtimeI18n))
    .replaceAll("__OBSERVATORY_LOCALE__", localeName)
    .replace("__OBSERVATORY_JS__", javascript);
}

async function packageDashboard() {
  const [shell, css, javascript, artifact, geojson, i18n, packageDefinition] = await Promise.all([
    readFile(join(templateDirectory, "shell.html"), "utf8"),
    readFile(join(templateDirectory, "app.css"), "utf8"),
    readFile(join(templateDirectory, "app.js"), "utf8"),
    readJson(join(root, "dashboard", "artifact.json")),
    readJson(join(root, "data", "reference", "world.geo.json")),
    readJson(join(templateDirectory, "i18n.json")),
    readJson(join(root, "package.json")),
  ]);

  if (artifact.manifest.version !== 4 || artifact.snapshot.version !== 4) {
    throw new Error("El contrato analítico no corresponde a la versión esperada.");
  }
  if (geojson.features.length < 170) {
    throw new Error("La geometría mundial contiene menos de 170 países.");
  }

  const news = await readJson(join(root, "data", "processed", "news.json"));
  news.editorial_items = (await readJson(join(root, "data/processed/editorial-news.json"))).items;
  const baseline = await readJson(join(root, "data", "baselines", "published-snapshot.json"));
  const current = await readJson(join(root, "data", "processed", "snapshot.json"));
  const key = (r) => [r.source_id, r.metric_id, r.iso3, r.year].join("|");
  const oldRows = new Map(baseline.observations.map(r => [key(r), r.value]));
  const newRows = new Map(current.observations.map(r => [key(r), r.value]));
  const change = {
    added: [...newRows].filter(([k]) => !oldRows.has(k)).length,
    removed: [...oldRows].filter(([k]) => !newRows.has(k)).length,
    changed: [...newRows].filter(([k,v]) => oldRows.has(k) && oldRows.get(k) !== v).length,
    baseline: baseline.generated_at,
  };
  const portal = await readFile(join(templateDirectory, "portal.js"), "utf8");
  const educationEvidence = await readJson(join(root, "data/processed/education-evidence.json"));
  const educationJs = await readFile(join(templateDirectory, "education-evidence.js"), "utf8");
  const runtime = javascript + "\nwindow.OBSERVATORY_NEWS=" + safeJson(news) + ";\nwindow.OBSERVATORY_CHANGES=" + safeJson(change) + ";\n" + portal + "\nwindow.OBSERVATORY_EDUCATION_EVIDENCE=" + safeJson(educationEvidence) + ";\n" + educationJs;
  const outputs = {};
  for (const localeName of ["es", "en"]) {
    const outputPath = join(dashboardDirectory, i18n[localeName].output);
    const html = renderLocale(shell, css, runtime, artifact, geojson, i18n, localeName, packageDefinition.version);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeText(outputPath, html);
    outputs[localeName] = { path: outputPath, bytes: Buffer.byteLength(html) };
  }
  return {
    outputs,
    countries: artifact.snapshot.datasets.country_profile.length,
    regions: artifact.snapshot.datasets.regional_summary.length,
    views: 8,
    locales: 2,
  };
}

packageDashboard()
  .then((result) => console.log(JSON.stringify({ ok: true, ...result })))
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
