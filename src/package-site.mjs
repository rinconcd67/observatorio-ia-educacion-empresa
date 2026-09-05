import { copyFile, mkdir, readFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { readJson, serializeJson, sha256Bytes, writeBytes, writeJson, writeText } from "./lib/io.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const siteDirectory = join(root, "_site");
const dataDirectory = join(siteDirectory, "data");
const publicDirectory = join(root, "src", "public");

const CSV_FIELDS = [
  "iso3", "iso2", "country", "region", "income_group", "year", "sector",
  "metric_id", "metric_name", "value", "unit", "source_id", "source_dataset",
];

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function observationsCsv(observations) {
  const lines = [CSV_FIELDS.join(",")];
  for (const row of observations) {
    lines.push(CSV_FIELDS.map((field) => csvCell(row[field])).join(","));
  }
  return `${lines.join("\n")}\n`;
}

async function packageSite() {
  const [artifact, snapshot, packageDefinition] = await Promise.all([
    readJson(join(root, "dashboard", "artifact.json")),
    readJson(join(root, "data", "processed", "snapshot.json")),
    readJson(join(root, "package.json")),
  ]);
  const [html, englishHtml] = await Promise.all([
    readFile(join(root, "dashboard", "index.html"), "utf8"),
    readFile(join(root, "dashboard", "en", "index.html"), "utf8"),
  ]);
  const csv = observationsCsv(snapshot.observations);
  const artifactBytes = Buffer.from(serializeJson(artifact), "utf8");
  const csvBytes = Buffer.from(csv, "utf8");
  const artifactFileSha256 = sha256Bytes(artifactBytes);
  const observationsCsvFileSha256 = sha256Bytes(csvBytes);
  const global = artifact.snapshot.datasets.global_summary[0];

  await rm(siteDirectory, { recursive: true, force: true });
  await Promise.all([
    mkdir(dataDirectory, { recursive: true }),
    mkdir(join(siteDirectory, "en"), { recursive: true }),
  ]);
  await writeText(join(siteDirectory, "index.html"), html);
  await writeText(join(siteDirectory, "en", "index.html"), englishHtml);
  await writeBytes(join(dataDirectory, "artifact.json"), artifactBytes);
  await writeBytes(join(dataDirectory, "observations.csv"), csvBytes);
  await writeJson(join(dataDirectory, "status.json"), {
    project: artifact.manifest.title,
    version: packageDefinition.version,
    languages: ["es", "en"],
    generated_at: snapshot.generated_at,
    status: snapshot.status,
    countries: snapshot.countries_count,
    observations: snapshot.observations_count,
    regions: global.regions,
    active_sources: snapshot.active_sources_count,
    healthy_sources: snapshot.healthy_sources_count,
    direct_countries: global.direct_countries,
    aipi_countries: global.aipi_countries,
    oxford_countries: global.government_readiness_countries,
    artifact_sha256: artifactFileSha256,
    artifact_file_sha256: artifactFileSha256,
    observations_csv_sha256: observationsCsvFileSha256,
    observations_csv_file_sha256: observationsCsvFileSha256,
    author: {
      name: "César David Rincón Godoy",
      orcid: "https://orcid.org/0009-0003-2112-3851",
      profile: "https://cesar-rincon-profile.rinconcd67.chatgpt.site",
    },
  });

  await copyFile(join(root, "data/processed/education-evidence.json"), join(dataDirectory, "education-evidence.json"));
  await copyFile(join(root, "data/processed/education-source-runs.json"), join(dataDirectory, "education-source-runs.json"));
  await copyFile(join(root, "data/processed/cima-context.json"), join(dataDirectory, "cima-context.json"));
  await copyFile(join(root, "data/processed/education-finance.json"), join(dataDirectory, "education-finance.json"));
  const publicFiles = [
    "404.html",
    "favicon.svg",
    "robots.txt",
    "site.webmanifest",
    "site.en.webmanifest",
    "sitemap.xml",
    "social-preview.png",
    "social-preview-en.png",
  ];
  await Promise.all(publicFiles.map((file) => copyFile(join(publicDirectory, file), join(siteDirectory, file))));
  await Promise.all([
    copyFile(join(root, "CITATION.cff"), join(dataDirectory, "citation.cff")),
    copyFile(join(root, "AUTHORS.md"), join(dataDirectory, "authors.txt")),
    copyFile(join(root, "AUTHORS.en.md"), join(dataDirectory, "authors.en.txt")),
    copyFile(join(root, "docs", "PRIVACIDAD.md"), join(dataDirectory, "privacy.txt")),
    copyFile(join(root, "docs", "PRIVACY.md"), join(dataDirectory, "privacy.en.txt")),
    copyFile(join(root, "docs", "POLITICA_DATOS.md"), join(dataDirectory, "data-policy.txt")),
    copyFile(join(root, "docs", "DATA_POLICY.md"), join(dataDirectory, "data-policy.en.txt")),
  ]);

  return {
    directory: siteDirectory,
    version: packageDefinition.version,
    html_bytes: Buffer.byteLength(html),
    csv_rows: snapshot.observations.length,
    files: 18,
  };
}

packageSite()
  .then((result) => console.log(JSON.stringify({ ok: true, ...result })))
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
