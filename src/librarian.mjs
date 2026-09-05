import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const populated = value => typeof value === 'string' && value.trim().length > 0;

export function validateCatalog(catalog) {
  const issues = [];
  if (!populated(catalog?.reviewed_date)) issues.push({ code: 'missing_review_date' });
  if (!Array.isArray(catalog?.items)) return [...issues, { code: 'missing_items' }];
  const ids = new Set(), urls = new Set();
  for (const item of catalog.items) {
    const issue = (code, field) => issues.push({ id: item.id ?? null, code, ...(field ? { field } : {}) });
    for (const key of ['id', 'organization', 'original_title', 'source_url', 'review_scope']) {
      if (!populated(item[key])) issue('missing_field', key);
    }
    if (!Number.isInteger(Number(item.year)) || Number(item.year) < 1900 || Number(item.year) > 2100) issue('invalid_year', 'year');
    if (!(populated(item.topic) || (Array.isArray(item.topic) && item.topic.length && item.topic.every(populated)))) issue('missing_field', 'topic');
    if (ids.has(item.id)) issue('duplicate_id', 'id');
    ids.add(item.id);
    try {
      const url = new URL(item.source_url);
      if (url.protocol !== 'https:' || url.username || url.password) issue('unsafe_url', 'source_url');
      url.hash = '';
      if (urls.has(url.href)) issue('duplicate_url', 'source_url');
      urls.add(url.href);
    } catch { issue('invalid_url', 'source_url'); }
    for (const lang of ['es', 'en']) {
      for (const field of ['title', 'summary', 'audience']) {
        if (!populated(item[lang]?.[field])) issue('incomplete_translation', `${lang}.${field}`);
      }
      if (!Array.isArray(item[lang]?.takeaways) || !item[lang].takeaways.length || !item[lang].takeaways.every(populated)) issue('incomplete_translation', `${lang}.takeaways`);
    }
  }
  return issues;
}

export function allowedUrl(value, allowedHosts) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && allowedHosts.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch { return false; }
}

// Redirects are checked before following them; no arbitrary or local URL requests.
export async function inspectLink(item, { fetchImpl = fetch, allowedHosts, previous, now = new Date().toISOString(), timeoutMs = 12000, maxBytes = 8_000_000 } = {}) {
  const priorSuccess = previous?.source_url === item.source_url ? previous.last_success : undefined;
  const base = { id: item.id, source_url: item.source_url, checked_at: now, ...(priorSuccess ? { last_success: priorSuccess } : {}) };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let url = item.source_url, response;
    for (let redirects = 0; redirects <= 4; redirects++) {
      if (!allowedUrl(url, allowedHosts ?? [])) return { ...base, status: 'blocked_url', needs_review: true };
      response = await fetchImpl(url, { signal: controller.signal, redirect: 'manual', headers: { 'User-Agent': 'ObservatorioLibrary/1.0 (source integrity review)', Accept: 'text/html,application/pdf,application/json;q=0.8,*/*;q=0.5' } });
      if (![301, 302, 303, 307, 308].includes(response.status)) break;
      const location = response.headers.get('location');
      await response.body?.cancel();
      if (!location || redirects === 4) throw new Error('redirect_limit_or_missing_location');
      url = new URL(location, url).href;
    }
    if (!response.ok) {
      await response.body?.cancel();
      return { ...base, status: [401, 403, 429].includes(response.status) ? 'access_blocked' : 'http_error', http_status: response.status, needs_review: true };
    }
    const hash = createHash('sha256');
    let bytes = 0;
    if (Number(response.headers.get('content-length')) > maxBytes) {
      await response.body?.cancel();
      return { ...base, status: 'size_limit', http_status: response.status, needs_review: true };
    }
    for await (const chunk of response.body ?? []) {
      bytes += chunk.length;
      if (bytes > maxBytes) { controller.abort(); return { ...base, status: 'size_limit', http_status: response.status, needs_review: true }; }
      hash.update(chunk);
    }
    const sha256 = hash.digest('hex');
    const changed = Boolean(priorSuccess && priorSuccess.sha256 !== sha256);
    return { ...base, status: changed ? 'possible_content_change' : 'ok', http_status: response.status, needs_review: changed,
      change_interpretation: changed ? 'Retrieved bytes changed; dynamic HTML may differ. This does not establish a new publication or edition.' : null,
      ...(priorSuccess ? { previous_success: priorSuccess } : {}),
      last_success: { checked_at: now, final_url: url, sha256, bytes, content_type: response.headers.get('content-type') } };
  } catch (error) {
    return { ...base, status: controller.signal.aborted ? 'timeout' : 'network_error', error: String(error.message).slice(0, 240), needs_review: true };
  } finally { clearTimeout(timer); }
}

export async function runLibrarian({ catalog, config, previous = {}, check = false, fetchImpl, now = new Date().toISOString(), timeoutMs } = {}) {
  const validation = validateCatalog(catalog);
  const checks = [];
  if (check) for (const item of catalog.items ?? []) {
    const prior = previous.checks?.find(entry => entry.id === item.id);
    checks.push(await inspectLink(item, { fetchImpl, allowedHosts: config.allowed_hosts, previous: prior, now, timeoutMs }));
  }
  // Offline checks must not erase the last network evidence.
  const preserved = check ? checks : (previous.checks ?? []);
  return {
    schema_version: 1, generated_at: now, mode: check ? 'check' : 'offline', catalog_reviewed_date: catalog.reviewed_date,
    policy: 'Proposal queue only. Catalog and publication are never modified. Byte changes require editorial assessment.',
    discovery: { status: 'editorial_review_required', sources: config.discovery_sources, note: 'Discovery portals are provided for research; no automatic claim extraction or new-item publication.' },
    validation: { valid: !validation.length, item_count: catalog.items?.length ?? 0, issues: validation },
    checks: preserved,
    proposals: [
      ...validation.map(issue => ({ type: 'catalog_correction', ...issue })),
      ...preserved.filter(result => result.needs_review).map(result => ({ type: result.status === 'possible_content_change' ? 'review_possible_change' : 'review_source_access', id: result.id, source_url: result.source_url, reason: result.status, checked_at: result.checked_at }))
    ],
    publication_performed: false
  };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => !['--offline', '--check'].includes(arg)) || args.includes('--offline') && args.includes('--check')) throw new Error('Usage: node src/librarian.mjs [--offline | --check]');
  const check = args.includes('--check');
  const catalog = JSON.parse(await readFile(resolve(ROOT, 'data/processed/library.json'), 'utf8'));
  const config = JSON.parse(await readFile(resolve(ROOT, 'config/library-sources.json'), 'utf8'));
  const outputPath = resolve(ROOT, 'reports/library-review.json');
  let previous = {};
  try { previous = JSON.parse(await readFile(outputPath, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const report = await runLibrarian({ catalog, config, previous, check });
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Bibliotecario: ${report.validation.item_count} fichas; ${report.validation.issues.length} problemas editoriales; ${report.proposals.length} propuestas. ${outputPath}`);
  if (!report.validation.valid || (check && report.checks.some(result => !['ok', 'possible_content_change'].includes(result.status)))) process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch(error => { console.error(error.message); process.exitCode = 1; });
