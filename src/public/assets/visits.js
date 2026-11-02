/* Minimal GoatCounter browser adapter. Contract and activation: docs/visits.md. */
(() => {
  'use strict';
  if (window.observatoryVisitsStarted) return;
  window.observatoryVisitsStarted = true;

  const ORIGIN = 'https://rinconcd67.github.io';
  const PREFIX = '/observatorio-ia-educacion-empresa/';
  const TIMEOUT_MS = 6000;
  const config = window.OBSERVATORY_VISITS_CONFIG;
  const locale = document.documentElement.lang === 'en' ? 'en' : 'es';
  const say = (es, en) => locale === 'es' ? es : en;
  const all = selector => Array.from(document.querySelectorAll(selector));
  const showText = (selector, text) => all(selector).forEach(node => { node.textContent = text; });
  let started = false;

  function permittedPage() {
    if (location.origin !== ORIGIN || !location.pathname.startsWith(PREFIX)) return false;
    // Restrict collection to actual page families. Assets, downloads, unknown
    // files and sibling GitHub repositories cannot enter this site's totals.
    const path = location.pathname.slice(PREFIX.length).replace(/index\.html$/, '');
    return /^(?:|en\/|(?:biblioteca|temas|skills|en\/(?:library|topics|skills))\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)?|(?:skills\/rutas|en\/skills\/routes)\/(?:start|teach|work|build)\/)$/.test(path);
  }

  function privateOrAutomated() {
    return [navigator.doNotTrack, window.doNotTrack, navigator.msDoNotTrack].some(value => value === '1' || value === 'yes')
      || navigator.globalPrivacyControl === true
      || navigator.webdriver === true
      || /bot|crawler|spider|headless|preview|lighthouse/i.test(navigator.userAgent || '')
      || window.top !== window.self;
  }

  function parseCount(payload) {
    const count = payload?.count;
    if (typeof count !== 'string' || count.length > 32) throw new Error('Invalid counter');
    // GoatCounter formats thousands using the site's selected separator.
    // Accept only complete groups with one consistent separator, never HTML,
    // decimals, negative values, scientific notation or mixed separators.
    if (!/^(?:0|[1-9]\d*|[1-9]\d{0,2}([,. \u00a0\u202f])\d{3}(?:\1\d{3})*)$/.test(count)) throw new Error('Invalid counter');
    const value = Number(count.replace(/[, .\u00a0\u202f]/g, ''));
    if (!Number.isSafeInteger(value) || value < 0) throw new Error('Invalid counter');
    return new Intl.NumberFormat(locale).format(value);
  }

  async function readCounter(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        method: 'GET', mode: 'cors', credentials: 'omit',
        referrerPolicy: 'no-referrer', signal: controller.signal,
      });
      if (!response.ok) throw new Error('Counter unavailable');
      const body = await response.text();
      if (body.length > 2048) throw new Error('Invalid counter');
      return parseCount(JSON.parse(body));
    } finally {
      clearTimeout(timeout);
    }
  }

  function countOnce(endpoint) {
    const path = location.pathname.replace(/index\.html$/, '');
    const url = new URL('/count', endpoint);
    url.searchParams.set('p', path);
    // ns is the wire representation of GoatCounter's no_session=true.
    url.searchParams.set('ns', 'true');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    // The request is intentionally not retried: an opaque response or network
    // error cannot prove whether the service already accepted the pageview.
    // No original query, fragment, title, screen size or referrer is sent.
    Promise.resolve().then(() => fetch(url.href, {
      method: 'POST', mode: 'no-cors', credentials: 'omit',
      referrerPolicy: 'no-referrer', keepalive: true, signal: controller.signal,
    })).catch(() => {}).finally(() => clearTimeout(timeout));
  }

  async function start() {
    if (started) return;
    all('[data-visits-widget]').forEach(node => { node.hidden = true; });
    if (!config || config.enabled !== true || !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(config.siteCode || '')
      || !permittedPage() || privateOrAutomated() || typeof fetch !== 'function' || typeof AbortController !== 'function') return;
    if (document.prerendering || (document.visibilityState && document.visibilityState !== 'visible')) return;
    started = true;
    document.removeEventListener('visibilitychange', start);
    const endpoint = `https://${config.siteCode}.goatcounter.com`;
    const now = new Date();
    const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`;
    const period = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(now);
    showText('[data-visits-total]', '…');
    showText('[data-visits-month]', '…');
    showText('[data-visits-period]', `${period} · UTC`);
    showText('[data-visits-status]', say('Consultando páginas vistas…', 'Loading pageviews…'));
    all('[data-visits-widget]').forEach(node => { node.hidden = false; });
    countOnce(endpoint);
    const totalUrl = `${endpoint}/counter/TOTAL.json`;
    const monthUrl = new URL(totalUrl);
    monthUrl.searchParams.set('start', month);
    // No `end`: its date is interpreted at 00:00 UTC inclusively by GoatCounter.
    // Supplying today's date would exclude most of today's observations.
    const results = await Promise.allSettled([readCounter(totalUrl), readCounter(monthUrl.href)]);
    for (const [index, selector] of ['[data-visits-total]', '[data-visits-month]'].entries()) {
      const result = results[index];
      showText(selector, result.status === 'fulfilled' ? result.value : say('No disponible', 'Unavailable'));
    }
    showText('[data-visits-status]', results.every(result => result.status === 'fulfilled')
      ? say('Páginas vistas · GoatCounter · actualización hasta cada 4 h.', 'Pageviews · GoatCounter · updates may take up to 4 h.')
      : say('Medición temporalmente no disponible. No se estiman cifras.', 'Measurement temporarily unavailable. No figures are estimated.'));
  }

  function ready() {
    document.addEventListener('visibilitychange', start);
    start();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true });
  else ready();
})();
