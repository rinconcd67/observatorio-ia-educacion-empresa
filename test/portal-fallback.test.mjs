import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { renderPortalFallback } from '../src/lib/portal-fallback.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const catalogue = JSON.parse(await readFile(join(root, 'src/content/official-sources.json'), 'utf8'));

test('initial portal is readable without JavaScript and exposes every official source in both languages', () => {
  for (const locale of ['es','en']) {
    const html = renderPortalFallback(locale,catalogue);
    assert.equal((html.match(/<h1>/g) ?? []).length,1);
    assert.ok(html.includes(locale==='es'?'Entiende la IA.':'Understand AI.'));
    assert.ok(html.includes(locale==='es'?'inteligencia artificial transforma':'artificial intelligence is transforming'));
    assert.equal(/<script|<noscript|\bhidden\b/.test(html),false);
    const targets=[...html.matchAll(/<a[^>]* href="([^"]+)"/g)].map(([,href])=>href.replaceAll('&amp;','&'));
    for(const item of catalogue.items){
      assert.ok(targets.includes(new URL(item.url).href),`${locale}: ${item.id}`);
      assert.ok(html.includes(item[locale].title.replaceAll('&','&amp;')),`${locale}: ${item.id}`);
    }
  }
});

test('initial portal resource and image links resolve within the locale and GitHub Pages subdirectory', async () => {
  const base='https://rinconcd67.github.io/observatorio-ia-educacion-empresa/';
  for(const locale of ['es','en']){
    const location=base+(locale==='en'?'en/':'');
    const html=renderPortalFallback(locale,catalogue);
    const urls=[...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(([,href])=>new URL(href.replaceAll('&amp;','&'),location));
    const local=urls.filter(url=>url.origin===new URL(base).origin);
    for(const url of local){
      assert.ok(url.href.startsWith(base));
      const path=url.pathname.slice(new URL(base).pathname.length);
      assert.ok((await stat(join(root,'_site',path,path.endsWith('/')?'index.html':''))).isFile(),url.href);
    }
    assert.ok(local.some(url=>url.href===location+(locale==='es'?'biblioteca/':'library/')));
    assert.ok(local.some(url=>url.href===location+'skills/'));
    assert.ok(local.some(url=>url.href===location+(locale==='es'?'temas/':'topics/')));
  }
});

test('initial portal escapes source data and refuses unsafe source URLs or missing translations', () => {
  const sample={scope:{es:'<scope>',en:'Scope'},items:[{id:'test',name:'<img onerror="bad">',url:'https://example.com/?a=1&b=2',es:{title:'A & B',description:'<script>bad</script>'},en:{title:'A',description:'B'}}]};
  const html=renderPortalFallback('es',sample);
  assert.ok(html.includes('&lt;scope&gt;'));
  assert.ok(html.includes('&lt;img onerror=&quot;bad&quot;&gt;'));
  assert.ok(html.includes('?a=1&amp;b=2'));
  assert.equal(html.includes('<script>bad'),false);
  for(const url of ['javascript:alert(1)','http://example.com','https://user:pass@example.com']){
    const unsafe=structuredClone(sample);unsafe.items[0].url=url;
    assert.throws(()=>renderPortalFallback('es',unsafe));
  }
  const untranslated=structuredClone(sample);delete untranslated.items[0].en;
  assert.throws(()=>renderPortalFallback('en',untranslated));
  assert.throws(()=>renderPortalFallback('fr',sample));
});
