import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectLink, validateCatalog, runLibrarian } from '../src/librarian.mjs';

const translation = { title: 'Title', summary: 'Summary', audience: 'Teachers', takeaways: ['Evidence'] };
const item = { id: 'one', organization: 'UNESCO', year: 2024, original_title: 'Original', source_url: 'https://www.unesco.org/example', topic: 'education', review_scope: 'abstract', es: { ...translation }, en: { ...translation } };
const catalog = { reviewed_date: '2026-09-04', items: [item] };
const config = { allowed_hosts: ['unesco.org'], discovery_sources: [] };

test('bilingual validation rejects missing English and duplicate resources', () => {
  assert.deepEqual(validateCatalog(catalog), []);
  const bad = structuredClone(catalog);
  delete bad.items[0].en.summary;
  bad.items.push({ ...item });
  const codes = validateCatalog(bad).map(issue => issue.code);
  assert.ok(codes.includes('incomplete_translation'));
  assert.ok(codes.includes('duplicate_id'));
  assert.ok(codes.includes('duplicate_url'));
});

test('HTTP 403 preserves last known successful verification', async () => {
  const previous = { source_url: item.source_url, last_success: { sha256: 'old', checked_at: '2026-09-01' } };
  const result = await inspectLink(item, { allowedHosts: config.allowed_hosts, previous, fetchImpl: async () => new Response('blocked', { status: 403 }) });
  assert.equal(result.status, 'access_blocked');
  assert.deepEqual(result.last_success, previous.last_success);
});

test('byte changes become proposals, never claims of a new edition', async () => {
  const first = await inspectLink(item, { allowedHosts: config.allowed_hosts, fetchImpl: async () => new Response('first') });
  const report = await runLibrarian({ catalog, config, previous: { checks: [first] }, check: true, fetchImpl: async () => new Response('updated menu') });
  assert.equal(report.checks[0].status, 'possible_content_change');
  assert.equal(report.proposals[0].type, 'review_possible_change');
  assert.match(report.checks[0].change_interpretation, /does not establish/);
  assert.equal(report.publication_performed, false);
  assert.deepEqual(catalog.items[0], item);
});

test('redirects to unapproved hosts are never fetched', async () => {
  let calls = 0;
  const result = await inspectLink(item, { allowedHosts: config.allowed_hosts, fetchImpl: async () => { calls++; return new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/private' } }); } });
  assert.equal(result.status, 'blocked_url');
  assert.equal(calls, 1);
});

test('timeout is distinct from HTTP failure', async () => {
  const result = await inspectLink(item, { allowedHosts: config.allowed_hosts, timeoutMs: 5, fetchImpl: (_, { signal }) => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')))) });
  assert.equal(result.status, 'timeout');
});

test('offline validation retains prior network evidence without fetching', async () => {
  const checks = [{ id: item.id, status: 'ok', last_success: { sha256: 'prior' } }];
  const result = await runLibrarian({ catalog, config, previous: { checks }, fetchImpl: () => { throw new Error('No network allowed'); } });
  assert.deepEqual(result.checks, checks);
  assert.equal(result.mode, 'offline');
});

test('size limit does not replace previous good hash with partial content', async () => {
  const previous = { source_url: item.source_url, last_success: { sha256: 'prior' } };
  const result = await inspectLink(item, { previous, allowedHosts: config.allowed_hosts, maxBytes: 2, fetchImpl: async () => new Response('large') });
  assert.equal(result.status, 'size_limit');
  assert.equal(result.last_success.sha256, 'prior');
});

test('old successful evidence is not reused after a source URL change', async () => {
  const result = await inspectLink(item, { allowedHosts: config.allowed_hosts, previous: { source_url: 'https://www.unesco.org/other', last_success: { sha256: 'unrelated' } }, fetchImpl: async () => new Response('no', { status: 403 }) });
  assert.equal(result.last_success, undefined);
});
