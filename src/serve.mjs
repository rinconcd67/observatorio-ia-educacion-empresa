import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dashboardRoot = join(root, "_site");
const port = Number(process.env.OBSERVATORY_PORT ?? 4173);
const types = {
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json",
  ".cff": "text/plain; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

const server = createServer(async (request, response) => {
  const relative = request.url === "/" ? "index.html" : request.url.split("?")[0].replace(/^\//, "");
  const candidate = normalize(join(dashboardRoot, relative));
  if (!candidate.startsWith(dashboardRoot)) {
    response.writeHead(403).end("Acceso denegado");
    return;
  }
  try {
    const body = await readFile(candidate);
    response.writeHead(200, {
      "content-type": types[extname(candidate)] ?? "application/octet-stream",
      "cache-control": "no-store",
    });
    response.end(body);
  } catch {
    response.writeHead(404).end("No encontrado");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Observatorio disponible en http://127.0.0.1:${port}`);
});
