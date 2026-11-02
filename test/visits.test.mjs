import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const source = await readFile(fileURLToPath(new URL('../src/public/assets/visits.js', import.meta.url)), 'utf8');
const configSource = await readFile(fileURLToPath(new URL('../src/public/assets/visits-config.js', import.meta.url)), 'utf8');
const production = 'https://rinconcd67.github.io/observatorio-ia-educacion-empresa/';
const tick = () => new Promise(resolve => setImmediate(resolve));

function browser(options = {}) {
  const selectorNames = ['widget', 'total', 'month', 'period', 'status'];
  const elements = new Map(selectorNames.map(name => [`[data-visits-${name}]`, [
    { textContent: '', hidden: true }, { textContent: '', hidden: true },
  ]]));
  const events = new Map();
  const document = {
    documentElement: { lang: options.lang || 'es' },
    readyState: options.loading ? 'loading' : 'complete',
    visibilityState: options.hidden ? 'hidden' : 'visible',
    prerendering: options.prerendering || false,
    querySelectorAll: selector => elements.get(selector) || [],
    addEventListener(type, fn) { if (!events.has(type)) events.set(type, new Set()); events.get(type).add(fn); },
    removeEventListener(type, fn) { events.get(type)?.delete(fn); },
  };
  const forbidden = () => { throw new Error('No storage or cookies allowed'); };
  Object.defineProperty(document, 'cookie', { get: forbidden, set: forbidden });
  const calls = [];
  const timers = new Map();
  let timerId = 0;
  const moment = options.now || '2026-11-01T00:30:00Z';
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [moment])); } }
  const context = vm.createContext({
    URL, Intl, AbortController, Date: Clock,
    document,
    location: new URL(options.url || production),
    navigator: { userAgent: 'Mozilla/5.0 Chrome/130.0', ...options.navigator },
    setTimeout(fn, delay) { const id = ++timerId; timers.set(id, { fn, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    fetch(url, init) {
      const call = { url: String(url), init }; calls.push(call);
      if (options.fetch) return options.fetch(call);
      return Promise.resolve({ ok: true, text: async () => JSON.stringify({ count: new URL(url).searchParams.has('start') ? '234' : '1,234' }) });
    },
  });
  context.window = context;
  context.self = context;
  context.top = options.iframe ? {} : context;
  Object.defineProperty(context, 'localStorage', { get: forbidden });
  Object.defineProperty(context, 'sessionStorage', { get: forbidden });
  context.OBSERVATORY_VISITS_CONFIG = options.config ?? { enabled: true, siteCode: 'observatorio-test-fixture' };
  const run = () => vm.runInContext(source, context);
  run();
  return {
    context, document, calls, elements, timers, run,
    first: name => elements.get(`[data-visits-${name}]`)[0],
    fire: type => Array.from(events.get(type) || []).forEach(fn => fn()),
    async flush() { await tick(); await tick(); },
    expire() { for (const [id, item] of Array.from(timers)) { timers.delete(id); item.fn(); } },
  };
}

const collection = ui => ui.calls.filter(call => new URL(call.url).pathname === '/count');
const statistics = ui => ui.calls.filter(call => new URL(call.url).pathname.startsWith('/counter/'));

test('public configuration permits only a valid site code and no credentials', () => {
  const context = vm.createContext({}); context.window = context;
  vm.runInContext(configSource, context);
  assert.equal(typeof context.OBSERVATORY_VISITS_CONFIG.enabled, 'boolean');
  if (context.OBSERVATORY_VISITS_CONFIG.enabled) assert.match(context.OBSERVATORY_VISITS_CONFIG.siteCode, /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/);
  else assert.equal(typeof context.OBSERVATORY_VISITS_CONFIG.siteCode, 'string');
  assert.deepEqual(Object.keys(context.OBSERVATORY_VISITS_CONFIG).sort(), ['enabled', 'siteCode']);
});

test('disabled, absent or malformed account configuration makes no requests and keeps widgets hidden', async () => {
  for (const config of [
    { enabled: false, siteCode: 'observatorio-test-fixture' }, {},
    { enabled: true, siteCode: '' }, { enabled: true, siteCode: 'https://example.com' },
    { enabled: true, siteCode: 'safe.goatcounter.com/../evil' },
    { enabled: 'true', siteCode: 'observatorio-test-fixture' },
  ]) {
    const ui = browser({ config }); await ui.flush();
    assert.equal(ui.calls.length, 0);
    assert.equal(ui.first('widget').hidden, true);
    assert.equal(ui.first('total').textContent, '');
  }
});

test('only the exact production origin and intended page families may count', async () => {
  for (const url of [
    'http://localhost:4173/', 'http://127.0.0.1:4173/',
    production.replace('https:', 'http:'), production.replace('rinconcd67.github.io', 'rinconcd67.github.io.example.com'),
    'https://rinconcd67.github.io/another-project/', `${production}../another-project/`,
    `${production}data/artifact.json`, `${production}assets/learning-together.webp`,
    `${production}unknown/`, `${production}404.html`, `${production}skills/arbitrary/deeper/path/`,
  ]) {
    const ui = browser({ url }); await ui.flush();
    assert.equal(ui.calls.length, 0, url);
    assert.equal(ui.first('widget').hidden, true, url);
  }
  for (const path of ['', 'index.html', 'en/', 'en/index.html', 'biblioteca/', 'biblioteca/unesco-teachers-2024/', 'en/library/unesco-teachers-2024/', 'temas/education/', 'en/topics/education/', 'skills/', 'skills/elements-ai-intro/', 'skills/rutas/start/', 'en/skills/routes/build/']) {
    const ui = browser({ url: production + path }); await ui.flush();
    assert.equal(collection(ui).length, 1, path);
  }
});

test('DNT, global privacy control, automated browsers and frames make no third-party requests', async () => {
  for (const options of [
    { navigator: { doNotTrack: '1' } }, { navigator: { doNotTrack: 'yes' } },
    { navigator: { msDoNotTrack: '1' } }, { navigator: { globalPrivacyControl: true } },
    { navigator: { webdriver: true } }, { navigator: { userAgent: 'ExampleBot/1.0' } }, { iframe: true },
  ]) {
    const ui = browser(options); await ui.flush();
    assert.equal(ui.calls.length, 0);
    assert.equal(ui.first('widget').hidden, true);
  }
});

test('count payload contains only canonical pathname and no_session; query, hash and referrer never leave the page', async () => {
  const ui = browser({ url: `${production}en/index.html?email=private%40example.com&view=business#private` }); await ui.flush();
  const [call] = collection(ui);
  const url = new URL(call.url);
  assert.equal(url.origin, 'https://observatorio-test-fixture.goatcounter.com');
  assert.equal(url.searchParams.get('p'), '/observatorio-ia-educacion-empresa/en/');
  assert.equal(url.searchParams.get('ns'), 'true');
  assert.deepEqual([...url.searchParams.keys()].sort(), ['ns', 'p']);
  assert.equal(call.init.method, 'POST');
  assert.equal(call.init.mode, 'no-cors');
  assert.equal(call.init.credentials, 'omit');
  assert.equal(call.init.referrerPolicy, 'no-referrer');
  assert.equal(call.init.body, undefined);
  for (const request of ui.calls) assert.ok(!request.url.includes('private'));
});

test('one pageview per document despite duplicate script execution and visibility events', async () => {
  const ui = browser();
  ui.run(); ui.fire('visibilitychange'); ui.fire('DOMContentLoaded');
  await ui.flush();
  assert.equal(collection(ui).length, 1);
  assert.equal(statistics(ui).length, 2);
  assert.equal(ui.first('widget').hidden, false);
  assert.equal(ui.timers.size, 0);
});

test('loading, background and prerender documents wait until their content is ready and visible', async () => {
  const ui = browser({ loading: true, hidden: true, prerendering: true }); await ui.flush();
  assert.equal(ui.calls.length, 0);
  ui.fire('DOMContentLoaded'); await ui.flush();
  assert.equal(ui.calls.length, 0);
  ui.document.visibilityState = 'visible';
  ui.document.prerendering = false;
  ui.fire('visibilitychange'); await ui.flush();
  assert.equal(collection(ui).length, 1);
});

test('monthly totals use explicit first day UTC and omit inclusive-midnight end; all-time total is unbounded', async () => {
  for (const [now, start] of [['2026-11-01T00:30:00Z', '2026-11-01'], ['2027-01-01T00:05:00Z', '2027-01-01']]) {
    const ui = browser({ now, lang: 'en' }); await ui.flush();
    const urls = statistics(ui).map(call => new URL(call.url));
    assert.equal(urls.filter(url => !url.search).length, 1);
    const monthly = urls.find(url => url.search);
    assert.equal(monthly.searchParams.get('start'), start);
    assert.equal(monthly.searchParams.has('end'), false);
    assert.deepEqual([...monthly.searchParams.keys()], ['start']);
    assert.match(ui.first('period').textContent, /UTC$/);
    assert.equal(ui.first('total').textContent, '1,234');
    assert.equal(ui.first('month').textContent, '234');
    assert.match(ui.first('status').textContent, /Pageviews/);
    assert.ok(ui.elements.get('[data-visits-total]').every(node => node.textContent === '1,234'));
  }
});

test('public formatted counts are validated and safely rendered, including real zero', async () => {
  for (const count of ['0', '42', '12,345', '1.234.567', '1\u202f234\u202f567', '1 234']) {
    const ui = browser({ lang: 'en', fetch: async () => ({ ok: true, text: async () => JSON.stringify({ count }) }) }); await ui.flush();
    assert.ok(!ui.first('total').textContent.includes('Unavailable'), count);
    assert.match(ui.first('total').textContent, /^[0-9,]+$/);
  }
  for (const count of [0, null, '-1', '1e3', '1,23', '1,234.567', '<img src=x>', '9007199254740992', '', '0,123']) {
    const ui = browser({ fetch: async () => ({ ok: true, text: async () => JSON.stringify({ count }) }) }); await ui.flush();
    assert.equal(ui.first('total').textContent, 'No disponible', String(count));
    assert.equal(ui.first('month').textContent, 'No disponible', String(count));
  }
});

test('partial or failed measurement never invents a zero and count failures are not retried', async () => {
  const ui = browser({ fetch: async ({ url }) => {
    if (new URL(url).pathname === '/count') throw new Error('network failure');
    return { ok: !new URL(url).search, text: async () => '{"count":"456"}' };
  } }); await ui.flush();
  assert.equal(ui.first('total').textContent, '456');
  assert.equal(ui.first('month').textContent, 'No disponible');
  assert.match(ui.first('status').textContent, /No se estiman/);
  ui.fire('visibilitychange'); await ui.flush();
  assert.equal(collection(ui).length, 1);
});

test('GET requests time out including body reads; rejection leaves no timers or fake statistics', async () => {
  const ui = browser({ fetch: async ({ init }) => {
    if (init.method === 'POST') return {};
    return { ok: true, text: () => new Promise((resolve, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted')))) };
  } }); await ui.flush();
  assert.equal(ui.first('total').textContent, '…');
  assert.ok([...ui.timers.values()].every(timer => timer.delay === 6000));
  ui.expire(); await ui.flush();
  assert.equal(ui.first('total').textContent, 'No disponible');
  assert.equal(ui.first('month').textContent, 'No disponible');
  assert.equal(ui.timers.size, 0);
});
