import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFile(join(root, path), 'utf8');
const [core, discovery, catalogue, library, skills, artifact] = await Promise.all([
  read('src/dashboard/discovery-core.js'),
  read('src/dashboard/discovery.js'),
  read('src/content/official-sources.json').then(JSON.parse),
  read('data/processed/library.json').then(JSON.parse),
  read('data/processed/skills.json').then(JSON.parse),
  read('dashboard/artifact.json').then(JSON.parse),
]);
const context = vm.createContext({});
vm.runInContext(core, context);
const api = context.ObservatoryDiscovery;

const searchItems = [
  { id: 'teacher', kind: 'publication', title: 'Competencias docentes', description: 'Educación e inteligencia artificial', keywords: 'UNESCO' },
  { id: 'course', kind: 'skill', title: 'Educación con IA', description: 'Curso para docentes', keywords: 'UNESCO formación' },
  { id: 'country', kind: 'country', title: 'Chile', description: 'América Latina', keywords: 'CHL' },
];
const ids = rows => Array.from(rows, row => row.id);

test('discovery search normalizes accents, case and whitespace across fields without mutating its index', () => {
  const before = JSON.stringify(searchItems);
  assert.equal(api.normalize('  EDUCACIÓN  '), 'educacion');
  assert.deepEqual(ids(api.search(searchItems, '  uNeScO   EDUCACION ')), ['teacher', 'course']);
  assert.deepEqual(ids(api.search(searchItems, 'américa CHL')), ['country']);
  assert.deepEqual(ids(api.search(searchItems, 'educacion', 'skill')), ['course']);
  assert.equal(JSON.stringify(searchItems), before);
});

test('discovery search requires every token and respects category-only and empty results', () => {
  assert.deepEqual(ids(api.search(searchItems, 'docentes Chile')), []);
  assert.deepEqual(ids(api.search(searchItems, 'not-a-known-topic')), []);
  assert.deepEqual(ids(api.search(searchItems, '', 'country')), ['country']);
  assert.deepEqual(ids(api.search(searchItems, 'Chile', 'publication')), []);
  assert.deepEqual(ids(api.search([], 'educación')), []);
});

test('official source filters intersect region and resource type and handle empty combinations', () => {
  const items = [
    { id: 'a', region: 'americas', type: 'research' },
    { id: 'b', region: 'americas', type: 'skills' },
    { id: 'c', region: 'europe', type: 'skills' },
  ];
  assert.deepEqual(ids(api.filterSources(items)), ['a', 'b', 'c']);
  assert.deepEqual(ids(api.filterSources(items, 'americas')), ['a', 'b']);
  assert.deepEqual(ids(api.filterSources(items, '', 'skills')), ['b', 'c']);
  assert.deepEqual(ids(api.filterSources(items, 'americas', 'skills')), ['b']);
  assert.deepEqual(ids(api.filterSources(items, 'europe', 'research')), []);
});

test('official directory records have safe URLs, unique identities and complete bilingual labels', () => {
  const regions = new Set(['global', 'americas', 'europe', 'asia', 'africa', 'oceania']);
  const types = new Set(['observatory', 'research', 'skills', 'initiative']);
  assert.ok(catalogue.items.length > 0);
  assert.equal(new Set(catalogue.items.map(row => row.id)).size, catalogue.items.length);
  assert.equal(new Set(catalogue.items.map(row => row.url)).size, catalogue.items.length);
  for (const row of catalogue.items) {
    assert.match(row.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(row.name.trim(), row.id);
    assert.ok(regions.has(row.region), row.id);
    assert.ok(types.has(row.type), row.id);
    const url = new URL(row.url);
    assert.equal(url.protocol, 'https:', row.id);
    assert.equal(url.username + url.password, '', row.id);
    for (const locale of ['es', 'en']) {
      assert.ok(row[locale]?.title?.trim(), `${row.id}: ${locale} title`);
      assert.ok(row[locale]?.description?.trim(), `${row.id}: ${locale} description`);
    }
  }
});

// Execute the actual DOM adapter without browser automation or network. This harness
// models only DOM methods used by discovery.js; visual/browser QA remains separate.
function mount(locale = 'es', base = 'http://127.0.0.1:4173/') {
  const elements = new Map();
  function element(id) {
    if (!elements.has(id)) elements.set(id, {
      id, innerHTML: '', textContent: '', value: '', hidden: false, listeners: {}, attributes: {},
      addEventListener(type, fn) { this.listeners[type] = fn; },
      setAttribute(name, value) { this.attributes[name] = value; },
      reportValidity() { return this.valid !== false; },
      focus() { this.focused = true; }, after() {}, before() {}, append() {},
    });
    return elements.get(id);
  }
  const forbidden = () => { throw new Error('Preview attempted network or persistence'); };
  const document = {
    getElementById(id) { return ['international-benchmark', 'hcai-glossary'].includes(id) ? null : element(id); },
    querySelector(selector) { return element(selector); },
    querySelectorAll() { return []; },
    createElement(tag) { return element(`created-${tag}`); },
  };
  Object.defineProperty(document, 'cookie', { get: forbidden, set: forbidden });
  const sandbox = vm.createContext({
    document, URL, location: { href: new URL(locale === 'en' ? 'en/' : './', base).href },
    window: { OBSERVATORY_LOCALE: locale, OBSERVATORY_OFFICIAL_SOURCES: catalogue, OBSERVATORY_ARTIFACT: artifact, OBSERVATORY_LIBRARY: library, OBSERVATORY_SKILLS: skills },
    fetch: forbidden, XMLHttpRequest: forbidden,
    localStorage: { setItem: forbidden, getItem: forbidden }, sessionStorage: { setItem: forbidden, getItem: forbidden },
    navigator: { sendBeacon: forbidden },
  });
  vm.runInContext(core, sandbox);
  vm.runInContext(discovery, sandbox);
  return { elements, element, fire(id, type, extras = {}) {
    const target = element(id);
    let prevented = false;
    const event = { currentTarget: target, target, preventDefault() { prevented = true; }, ...extras };
    assert.equal(typeof target.listeners[type], 'function', `${id}: missing ${type} listener`);
    target.listeners[type](event);
    return prevented;
  } };
}

test('search UI renders results, an empty state and resets category and query together', () => {
  for (const locale of ['es', 'en']) {
    const ui = mount(locale);
    ui.element('discover-query').value = 'Chile';
    ui.element('discover-kind').value = 'country';
    ui.fire('discover-query', 'input');
    assert.equal(ui.element('discover-results').hidden, false);
    assert.match(ui.element('discover-results').innerHTML, /country=CHL/);
    ui.element('discover-query').value = 'zqxnonexistent';
    ui.fire('discover-query', 'input');
    assert.equal(ui.element('discover-results').innerHTML, '');
    assert.ok(ui.element('discover-status').textContent.length > 0);
    ui.fire('.unified-search', 'reset');
    assert.equal(ui.element('discover-query').value, '');
    assert.equal(ui.element('discover-kind').value, '');
    assert.equal(ui.element('discover-results').hidden, true);
    assert.equal(ui.element('discover-status').textContent, '');
  }
});

test('search pagination exposes every result and starts over when the query or category changes', () => {
  const ui = mount();
  ui.element('discover-kind').value = 'country';
  ui.fire('discover-kind', 'change');
  const count = () => (ui.element('discover-results').innerHTML.match(/<li>/g) ?? []).length;
  assert.equal(count(), 12);
  assert.equal(ui.element('discover-more').hidden, false);
  ui.fire('discover-more', 'click');
  assert.equal(count(), 24);
  let steps = 0;
  while (!ui.element('discover-more').hidden && steps++ < 50) ui.fire('discover-more', 'click');
  assert.equal(count(), artifact.snapshot.datasets.country_profile.length);
  assert.equal(ui.element('discover-more').hidden, true);
  ui.element('discover-kind').value = 'publication';
  ui.fire('discover-kind', 'change');
  assert.equal(count(), Math.min(12, library.items.length));
  ui.element('discover-query').value = 'zzxnonexistent';
  ui.fire('discover-query', 'input');
  assert.equal(count(), 0);
  assert.equal(ui.element('discover-more').hidden, true);
  ui.fire('.unified-search', 'reset');
  assert.equal(ui.element('discover-more').hidden, true);
});

test('directory UI expands, combines filters, shows empty state and resets', () => {
  const ui = mount();
  const cardCount = () => (ui.element('directory-grid').innerHTML.match(/class="source-tile"/g) ?? []).length;
  assert.equal(cardCount(), Math.min(catalogue.items.length, 6));
  ui.fire('directory-more', 'click');
  assert.equal(cardCount(), catalogue.items.length);
  assert.equal(ui.element('directory-more').attributes['aria-expanded'], 'true');
  ui.element('directory-region').value = 'africa';
  ui.element('directory-type').value = 'skills';
  ui.fire('directory-type', 'change');
  assert.equal(cardCount(), catalogue.items.filter(row => row.region === 'africa' && row.type === 'skills').length);
  ui.element('directory-region').value = 'unknown';
  ui.fire('directory-region', 'change');
  assert.equal(cardCount(), 0);
  assert.match(ui.element('directory-grid').innerHTML, /<p>/);
  ui.fire('directory-reset', 'click');
  assert.equal(ui.element('directory-region').value + ui.element('directory-type').value, '');
  assert.equal(cardCount(), Math.min(catalogue.items.length, 6));
});

test('newsletter validates locally and neither persists nor sends the submitted address', () => {
  for (const locale of ['es', 'en']) {
    const ui = mount(locale);
    ui.element('newsletter-email').value = 'preview@example.com';
    ui.element('newsletter-form').valid = false;
    assert.equal(ui.fire('newsletter-form', 'submit'), true);
    assert.equal(ui.element('newsletter-status').textContent, '');
    ui.element('newsletter-form').valid = true;
    assert.equal(ui.fire('newsletter-form', 'submit'), true);
    assert.equal(ui.element('newsletter-email').value, '');
    assert.match(ui.element('newsletter-status').textContent, locale === 'es' ? /No se creó una suscripción/ : /No subscription was created/);
    assert.ok(!ui.element('newsletter-status').textContent.includes('preview@example.com'));
  }
});

const unescape = s => s.replaceAll('&amp;', '&').replaceAll('&#39;', "'").replaceAll('&quot;', '"');
test('generated discovery links and images resolve locally in ES/EN at root and GitHub Pages subpath', async () => {
  for (const base of ['http://127.0.0.1:4173/', 'https://rinconcd67.github.io/observatorio-ia-educacion-empresa/']) {
    for (const locale of ['es', 'en']) {
      const ui = mount(locale, base);
      for (const kind of ['', 'country', 'publication', 'skill', 'source']) {
        ui.element('discover-kind').value = kind;
        ui.fire('discover-kind', 'change');
        let pages = 0;
        while (!ui.element('discover-more').hidden && pages++ < 50) ui.fire('discover-more', 'click');
        for (const el of ui.elements.values()) {
          for (const [, raw] of el.innerHTML.matchAll(/(?:href|src)="([^"]+)"/g)) {
            const target = new URL(unescape(raw), new URL(locale === 'en' ? 'en/' : './', base));
            if (target.origin !== new URL(base).origin) continue;
            assert.ok(target.href.startsWith(base), `${locale}: ${target.href}`);
            const path = decodeURIComponent(target.pathname.slice(new URL(base).pathname.length));
            const file = join(root, '_site', path, path.endsWith('/') || !path ? 'index.html' : '');
            assert.ok((await stat(file)).isFile(), target.href);
            if (target.searchParams.get('view') === 'countries') {
              assert.ok(artifact.snapshot.datasets.country_profile.some(row => row.iso3 === target.searchParams.get('country')));
            }
          }
        }
      }
    }
  }
});

test('build ships the two pedagogical images and relative primary navigation for both languages', async () => {
  let deliveryBytes = 0;
  for (const name of ['learning-together.png', 'evidence-to-action.png', 'learning-together.webp', 'evidence-to-action.webp']) {
    const source = await readFile(join(root, 'src/public/assets', name));
    const output = await readFile(join(root, '_site/assets', name));
    assert.ok(source.length > 1000, name);
    assert.deepEqual(output, source, `${name}: packaged bytes differ`);
    if (name.endsWith('.webp')) deliveryBytes += output.length;
  }
  assert.ok(deliveryBytes < 300_000, `Pedagogical WebP assets exceed 300 KB: ${deliveryBytes}`);
  for (const [locale, page, paths] of [
    ['es', 'index.html', ['biblioteca/', 'temas/', 'skills/']],
    ['en', 'en/index.html', ['library/', 'topics/', 'skills/']],
  ]) {
    const html = await read(`_site/${page}`);
    const nav = html.match(/<nav class="primary-nav"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
    assert.ok(nav, `${locale}: primary nav`);
    for (const path of paths) assert.ok(nav.includes(`href="${path}"`), `${locale}: ${path}`);
    assert.ok(html.indexOf('globalThis.ObservatoryDiscovery =') < html.indexOf("const catalogue = window.OBSERVATORY_OFFICIAL_SOURCES;"), `${locale}: search contract precedes UI`);
  }
});

 test('production newsletter presents a sample without a fake subscription form', () => {
  for (const locale of ['es','en']) {
    const ui = mount(locale, 'https://rinconcd67.github.io/observatorio-ia-educacion-empresa/');
    assert.match(ui.element('newsletter-form').outerHTML, /newsletter-coming/);
    assert.doesNotMatch(ui.element('newsletter-form').outerHTML, /<input|<form/);
    assert.equal(ui.element('newsletter-form').listeners.submit, undefined);
    assert.equal(ui.element('created-section').hidden, true);
  }
});
