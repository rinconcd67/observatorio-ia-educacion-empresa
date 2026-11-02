import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = join(root, '_site');
const base = 'https://rinconcd67.github.io/observatorio-ia-educacion-empresa/';
const decode = value => value.replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');
const attributes = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, name, value]) => [name, decode(value)]));
const imagePath = lang => `assets/observatorio-social-${lang}-20261102.png`;

function pngSize(bytes, label) {
  assert.deepEqual(bytes.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), `${label}: PNG signature`);
  assert.equal(bytes.readUInt32BE(8), 13, `${label}: IHDR length`);
  assert.equal(bytes.toString('ascii', 12, 16), 'IHDR', `${label}: IHDR first chunk`);
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}

test('all sitemap pages expose one localized absolute social image and consistent Open Graph/Twitter metadata in initial HTML', async () => {
  const sitemap = await readFile(join(site, 'sitemap.xml'), 'utf8');
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(([, value]) => decode(value));
  assert.ok(urls.length >= 110, 'complete bilingual home/library/topics/Skills sitemap expected');
  assert.ok(urls.includes(base));
  assert.ok(urls.includes(base + 'en/'));
  for (const url of urls) {
    assert.ok(url.startsWith(base), url);
    const html = await readFile(join(site, url.slice(base.length), 'index.html'), 'utf8');
    const lang = html.match(/<html\b[^>]*lang="([^"]+)"/)[1];
    assert.ok(['es', 'en'].includes(lang), url);
    const head = html.match(/<head>([\s\S]*?)<\/head>/i)[1];
    const metas = [...head.matchAll(/<meta\b[^>]*>/g)].map(([tag]) => attributes(tag));
    const value = name => {
      const matches = metas.filter(meta => (name.startsWith('og:') ? meta.property : meta.name) === name);
      assert.equal(matches.length, 1, `${url}: exactly one ${name}`);
      assert.ok(matches[0].content?.trim(), `${url}: nonempty ${name}`);
      assert.doesNotMatch(matches[0].content, /__[A-Z_]+__/, `${url}: unresolved token`);
      return matches[0].content;
    };
    assert.equal(value('og:url'), url);
    assert.equal(value('og:type'), 'website');
    assert.equal(value('og:locale'), lang === 'es' ? 'es_ES' : 'en_US');
    assert.equal(value('og:image'), base + imagePath(lang));
    assert.equal(value('og:image:type'), 'image/png');
    assert.equal(value('og:image:width'), '1200');
    assert.equal(value('og:image:height'), '630');
    assert.match(value('og:image:alt'), lang === 'es' ? /^Sello del Observatorio/ : /^Seal of the Global AI Observatory/);
    assert.equal(value('twitter:card'), 'summary_large_image');
    assert.equal(value('twitter:title'), value('og:title'));
    assert.equal(value('twitter:description'), value('og:description'));
    assert.equal(value('twitter:image'), value('og:image'));
    assert.equal(value('twitter:image:alt'), value('og:image:alt'));
    const image = await readFile(join(site, imagePath(lang)));
    assert.deepEqual(pngSize(image, url), [1200, 630]);
  }
});

test('versioned social PNGs and legacy aliases are identical in source and deployment output', async () => {
  for (const lang of ['es', 'en']) {
    const path = imagePath(lang);
    const source = await readFile(join(root, 'src/public', path));
    assert.deepEqual(pngSize(source, path), [1200, 630]);
    assert.deepEqual(await readFile(join(site, path)), source, `${lang}: deployed versioned image`);
    const alias = lang === 'es' ? 'social-preview.png' : 'social-preview-en.png';
    assert.deepEqual(await readFile(join(root, 'src/public', alias)), source, `${lang}: source legacy alias`);
    assert.deepEqual(await readFile(join(site, alias)), source, `${lang}: deployed legacy alias`);
  }
});
