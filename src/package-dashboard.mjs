import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { readJson, writeText } from "./lib/io.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const templateDirectory = join(root, "src", "dashboard");
const outputPath = join(root, "dashboard", "index.html");

function safeJson(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

async function packageDashboard() {
  const [shell, css, javascript, artifact, geojson] = await Promise.all([
    readFile(join(templateDirectory, "shell.html"), "utf8"),
    readFile(join(templateDirectory, "app.css"), "utf8"),
    readFile(join(templateDirectory, "app.js"), "utf8"),
    readJson(join(root, "dashboard", "artifact.json")),
    readJson(join(root, "data", "reference", "world.geo.json")),
  ]);

  if (artifact.manifest.version !== 3 || artifact.snapshot.version !== 3) {
    throw new Error("El contrato analítico no corresponde a la versión 0.3.");
  }
  if (geojson.features.length < 170) {
    throw new Error("La geometría mundial contiene menos de 170 países.");
  }

  const html = shell
    .replace("__OBSERVATORY_CSS__", css)
    .replace("__OBSERVATORY_DATA__", safeJson(artifact))
    .replace("__OBSERVATORY_GEOJSON__", safeJson(geojson))
    .replace("__OBSERVATORY_JS__", javascript);

  await writeText(outputPath, html);
  return {
    html: outputPath,
    bytes: Buffer.byteLength(html),
    countries: artifact.snapshot.datasets.country_profile.length,
    regions: artifact.snapshot.datasets.regional_summary.length,
    views: 8,
  };
}

packageDashboard()
  .then((result) => console.log(JSON.stringify({ ok: true, ...result })))
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
