import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

function bytesFrom(value) {
  if (typeof value === "string") return Buffer.from(value, "utf8");
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }
  throw new TypeError("Se esperaban bytes, un ArrayBuffer o texto UTF-8.");
}

export function serializeJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

export async function writeJson(path, value) {
  await writeBytes(path, Buffer.from(serializeJson(value), "utf8"));
}

export async function writeText(path, value) {
  await writeBytes(path, Buffer.from(value, "utf8"));
}

export async function writeBytes(path, value) {
  await mkdir(dirname(path), { recursive: true });
  const temporaryPath = `${path}.tmp-${process.pid}`;
  await writeFile(temporaryPath, bytesFrom(value));
  await rename(temporaryPath, path);
}

export function sha256Bytes(value) {
  return createHash("sha256").update(bytesFrom(value)).digest("hex");
}

export function checksum(value) {
  if (typeof value === "string" || value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
    return sha256Bytes(value);
  }
  return sha256Bytes(Buffer.from(serializeJson(value), "utf8"));
}
