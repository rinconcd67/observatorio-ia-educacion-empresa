import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { fetchBytes, fetchJson, fetchResource, fetchText } from "../src/lib/http.mjs";
import { checksum, serializeJson, sha256Bytes, writeJson } from "../src/lib/io.mjs";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function readOptional(relativePath) {
  try {
    return await readFile(join(ROOT, relativePath));
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

test("la huella byte-exacta detecta cualquier cambio de contenido o fin de línea", () => {
  const original = Buffer.from('{"status":"ok"}\n', "utf8");
  const changedByte = Buffer.from('{"status":"no"}\n', "utf8");
  const changedLineEnding = Buffer.from('{"status":"ok"}\r\n', "utf8");

  assert.notEqual(sha256(original), sha256(changedByte));
  assert.notEqual(sha256(original), sha256(changedLineEnding));
});

test("writeJson, serializeJson y checksum comparten exactamente los mismos bytes", async () => {
  const directory = await mkdtemp(join(tmpdir(), "observatorio-integrity-"));
  const path = join(directory, "artifact.json");
  const value = { version: 1, nested: { status: "ok" }, rows: [1, 2, 3] };
  try {
    await writeJson(path, value);
    const bytes = await readFile(path);
    const serialized = Buffer.from(serializeJson(value), "utf8");
    assert.deepEqual(bytes, serialized);
    assert.equal(checksum(value), sha256Bytes(bytes));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("fetchResource conserva bytes y metadatos sin romper los wrappers existentes", async () => {
  const jsonUrl = "data:application/json;charset=utf-8,%7B%22status%22%3A%22ok%22%7D%0A";
  const textUrl = "data:text/plain;charset=utf-8,observatorio%0A";
  const resource = await fetchResource(jsonUrl, { attempts: 1 });

  assert.equal(new TextDecoder().decode(resource.bytes), '{"status":"ok"}\n');
  assert.equal(resource.status, 200);
  assert.match(resource.contentType, /^application\/json/);
  assert.deepEqual(await fetchJson(jsonUrl, { attempts: 1 }), { status: "ok" });
  assert.equal(await fetchText(textUrl, { attempts: 1 }), "observatorio\n");
  assert.deepEqual(await fetchBytes(textUrl, { attempts: 1 }), new TextEncoder().encode("observatorio\n"));
});

test("cada source_run identifica los bytes exactos de su archivo raw", async (context) => {
  const allRuns = JSON.parse(await readFile(join(ROOT, "data/processed/source_runs.json"), "utf8"));
  const sourceRuns = allRuns.filter((run) => run.status === "ok");
  const rawFiles = await Promise.all(sourceRuns.map((run) => readOptional(run.raw_path)));
  if (rawFiles.every((bytes) => bytes === null)) {
    context.skip("data/raw no está presente en este checkout; se verifica durante refresh:data");
    return;
  }

  const mismatches = [];
  for (const [index, run] of sourceRuns.entries()) {
    const bytes = rawFiles[index];
    assert.ok(bytes, `Falta ${run.raw_path}; un refresh parcial no puede validarse`);
    const actual = sha256(bytes);
    const declared = run.raw_sha256 ?? run.checksum_sha256;
    if (actual !== declared || run.checksum_scope !== "stored_file_bytes") {
      mismatches.push({
        source_id: run.source_id,
        raw_path: run.raw_path,
        checksum_scope: run.checksum_scope ?? null,
        declared,
        actual,
      });
    }
  }

  assert.deepEqual(
    mismatches,
    [],
    `Huellas raw que no representan los bytes almacenados:\n${JSON.stringify(mismatches, null, 2)}`,
  );
});

test("status.json declara el SHA-256 exacto de artifact.json", async (context) => {
  const statusBytes = await readOptional("_site/data/status.json");
  const artifactBytes = await readOptional("_site/data/artifact.json");
  if (statusBytes === null && artifactBytes === null) {
    context.skip("_site no está presente en este checkout; se verifica después de package:site");
    return;
  }

  assert.ok(statusBytes, "Falta _site/data/status.json en un paquete público parcial");
  assert.ok(artifactBytes, "Falta _site/data/artifact.json en un paquete público parcial");
  const status = JSON.parse(statusBytes.toString("utf8"));

  assert.equal(
    sha256(artifactBytes),
    status.artifact_sha256,
    "artifact_sha256 debe identificar los bytes exactos de _site/data/artifact.json",
  );
  assert.equal(status.artifact_file_sha256, status.artifact_sha256);
});

test("status.json declara el SHA-256 exacto de observations.csv", async (context) => {
  const statusBytes = await readOptional("_site/data/status.json");
  const csvBytes = await readOptional("_site/data/observations.csv");
  if (statusBytes === null && csvBytes === null) {
    context.skip("_site no está presente en este checkout; se verifica después de package:site");
    return;
  }

  assert.ok(statusBytes, "Falta _site/data/status.json en un paquete público parcial");
  assert.ok(csvBytes, "Falta _site/data/observations.csv en un paquete público parcial");
  const status = JSON.parse(statusBytes.toString("utf8"));

  assert.equal(
    sha256(csvBytes),
    status.observations_csv_sha256,
    "observations_csv_sha256 debe identificar los bytes exactos de _site/data/observations.csv",
  );
  assert.equal(status.observations_csv_file_sha256, status.observations_csv_sha256);
});
