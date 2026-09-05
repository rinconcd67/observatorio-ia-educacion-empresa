import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeItems, parseFeed, refreshNews } from '../src/refresh-news.mjs';
const source = { name: 'Official', url: 'https://example.org/feed', allowed_hosts: ['example.org'] };
const asOf = new Date('2026-09-04T16:00:00Z');
const article = { title: 'AI & education', url: 'https://example.org/news?utm_source=rss#top', published_at: 'Fri, 04 Sep 2026 10:00:00 GMT' };

test('RSS and Atom expose only headline, publication date and link', () => {
  const rss = '<rss><channel><item><title>AI &amp; education</title><link>https://example.org/news</link><pubDate>Fri, 04 Sep 2026 10:00:00 GMT</pubDate><description>Do not republish</description></item></channel></rss>';
  assert.equal(parseFeed(rss)[0].title, article.title);
  assert.equal(parseFeed(rss)[0].description, undefined);
  const atom = '<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Test</title><link href="https://example.org/atom"/><published>2026-09-03T00:00:00Z</published></entry></feed>';
  assert.equal(parseFeed(atom)[0].url, 'https://example.org/atom');
});
test('rejects entity declarations, HTML and malformed XML', () => {
  for (const xml of ['<!DOCTYPE rss [<!ENTITY x SYSTEM "file:///etc/passwd">]><rss/>', '<html/>', '<rss>']) assert.throws(() => parseFeed(xml));
});
test('rejects future, undated, external, script and credential links', () => {
  const invalid = [{ ...article, published_at: '2026-09-05' }, { ...article, published_at: '' }, { ...article, url: 'https://evil.test/x' }, { ...article, url: 'javascript:alert(1)' }, { ...article, url: 'https://user:password@example.org/news' }];
  assert.deepEqual(normalizeItems(invalid, source, asOf), []);
  assert.equal(normalizeItems([article], source, asOf)[0].url, 'https://example.org/news');
});
test('failure preserves last valid articles and successful retrieval timestamp', async () => {
  const previous = await refreshNews({ sources: [source], asOf, fetchFeed: async () => [article] });
  const next = await refreshNews({ sources: [source], previous, asOf: new Date('2026-09-04T17:00:00Z'), fetchFeed: async () => { throw new Error('HTTP 503'); } });
  assert.deepEqual(next.items, previous.items);
  assert.equal(next.sources[0].status, 'stale');
  assert.equal(next.sources[0].last_successful_at, previous.checked_at);
});
test('empty feed is a failure and never silently removes valid cache', async () => {
  const result = await refreshNews({ sources: [source], asOf, fetchFeed: async () => [] });
  assert.equal(result.sources[0].status, 'error');
  assert.deepEqual(result.items, []);
});
test('deduplicates canonical URLs and caps display at twelve', async () => {
  const rows = Array.from({ length: 20 }, (_, index) => ({ ...article, url: `https://example.org/${index}` }));
  const result = await refreshNews({ sources: [source], asOf, fetchFeed: async () => [...rows, ...rows] });
  assert.equal(result.items.length, 12);
  assert.equal(new Set(result.items.map((item) => item.url)).size, 12);
});
test('partial outage preserves source cache while successful sources advance', async () => {
  const second = { name: 'Second', url: 'https://second.example/feed', allowed_hosts: ['second.example'] };
  const previous = await refreshNews({ sources: [source, second], asOf, fetchFeed: async (feed) => [{ ...article, url: `https://${feed.allowed_hosts[0]}/old` }] });
  const result = await refreshNews({ sources: [source, second], previous, asOf, fetchFeed: async (feed) => {
    if (feed.name === source.name) throw new Error('HTTP 503');
    return [{ ...article, url: 'https://second.example/new' }];
  } });
  assert.equal(result.sources[0].status, 'stale');
  assert.equal(result.sources[1].status, 'ok');
  assert.ok(result.items.some((item) => item.url === 'https://example.org/old'));
  assert.ok(result.items.some((item) => item.url === 'https://second.example/new'));
  assert.ok(!result.items.some((item) => item.url === 'https://second.example/old'));
});
