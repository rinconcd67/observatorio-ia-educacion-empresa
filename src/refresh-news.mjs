import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { fetchResource } from './lib/http.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export function parseFeed(xml) {
  const result = spawnSync(process.env.PYTHON_BIN || 'python3', [join(root, 'src/lib/parse-news-feed.py')], {
    input: xml, encoding: 'utf8', maxBuffer: 4_000_000, timeout: 10_000,
  });
  if (result.error || result.status !== 0) throw new Error('RSS/Atom inválido o parser no disponible');
  return JSON.parse(result.stdout);
}

export function normalizeItems(items, source, asOf) {
  return items.flatMap((item) => {
    try {
      const url = new URL(item.url);
      const timestamp = Date.parse(item.published_at);
      const title = String(item.title || '').replace(/\s+/g, ' ').trim();
      if (url.protocol !== 'https:' || url.username || url.password || !source.allowed_hosts.includes(url.hostname)) return [];
      if (!title || title.length > 500 || /[<>]/.test(title) || !Number.isFinite(timestamp) || timestamp > asOf.getTime()) return [];
      url.hash = '';
      for (const key of [...url.searchParams.keys()]) if (/^(utm_|fbclid$|gclid$)/i.test(key)) url.searchParams.delete(key);
      return [{ title, url: url.href, published_at: new Date(timestamp).toISOString(), source: source.name }];
    } catch { return []; }
  });
}

export async function refreshNews({ sources, previous = {}, asOf = new Date(), fetchFeed = async (source) => {
  const response = await fetchResource(source.url, { attempts: 2, timeoutMs: 20_000, headers: { accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml' } });
  if (response.bytes.byteLength > 2_000_000) throw new Error('Feed supera 2 MB');
  return parseFeed(response.bytes);
} }) {
  if (!Number.isFinite(asOf.getTime())) throw new Error('Fecha de corte inválida');
  const checked_at = asOf.toISOString();
  const results = await Promise.all(sources.map(async (source) => {
    try {
      const items = normalizeItems(await fetchFeed(source), source, asOf);
      if (!items.length) throw new Error('Sin titulares válidos a la fecha de corte');
      return { items, status: { name: source.name, url: source.url, status: 'ok', last_successful_at: checked_at } };
    } catch (error) {
      const items = normalizeItems((previous.items || []).filter((item) => item.source === source.name), source, asOf);
      const oldStatus = previous.sources?.find((item) => item.name === source.name);
      return { items, status: { name: source.name, url: source.url, status: items.length ? 'stale' : 'error', error: String(error.message).slice(0, 250), last_successful_at: oldStatus?.last_successful_at || null } };
    }
  }));
  const seen = new Set();
  // Reserve space for every source so one provider cannot occupy the entire window.
  const perSource = Math.max(1, Math.floor(12 / sources.length));
  const items = results.flatMap((result) => result.items.sort((a, b) => b.published_at.localeCompare(a.published_at)).filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  }).slice(0, perSource)).sort((a, b) => b.published_at.localeCompare(a.published_at)).slice(0, 12);
  return { checked_at, items, sources: results.map((result) => result.status) };
}

async function main() {
  const config = JSON.parse(await readFile(join(root, 'config/news-sources.json'), 'utf8'));
  const outputPath = join(root, 'data/processed/news.json');
  let previous = {};
  try { previous = JSON.parse(await readFile(outputPath, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const asOfArg = process.argv.indexOf('--as-of');
  const asOf = asOfArg >= 0 ? new Date(process.argv[asOfArg + 1]) : new Date();
  const output = await refreshNews({ ...config, previous, asOf });
  await mkdir(dirname(outputPath), { recursive: true });
  const temporary = `${outputPath}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(output, null, 2)}\n`);
  await rename(temporary, outputPath);
  console.log(JSON.stringify({ checked_at: output.checked_at, items: output.items.length, sources: output.sources }, null, 2));
  if (output.sources.every((source) => source.status === 'error')) process.exitCode = 1;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
