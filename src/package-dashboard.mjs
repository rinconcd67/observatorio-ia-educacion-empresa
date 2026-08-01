import { spawnSync } from "node:child_process";
import { readdir, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pluginBase = join(homedir(), ".codex", "plugins", "cache", "openai-curated-remote", "data-analytics");

async function findDeliveryScript() {
  const versions = (await readdir(pluginBase)).sort().reverse();
  for (const version of versions) {
    const candidate = join(pluginBase, version, "skills", "build-report", "scripts", "deliver_portable_artifact.mjs");
    try {
      if ((await stat(candidate)).isFile()) return candidate;
    } catch {
      // Continúa con la siguiente versión instalada.
    }
  }
  throw new Error("No se encontró el empaquetador de dashboards de Data Analytics.");
}

const script = await findDeliveryScript();
const result = spawnSync(process.execPath, [
  script,
  "--input", join(root, "dashboard", "artifact.json"),
  "--output", join(root, "dashboard", "index.html"),
  "--ready-timeout-ms", "15000",
  "--action-timeout-ms", "7500",
  "--timeout-ms", "60000",
], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.status !== 0) process.exit(result.status ?? 1);
