import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = join(root, '_site');
const base = 'https://rinconcd67.github.io/observatorio-ia-educacion-empresa/';
const decode = value => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>');
const attributes = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([,name,value]) => [name, decode(value)]));
const xml = await readFile(join(site, 'sitemap.xml'), 'utf8');
const urls = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([,body]) => ({
  loc: decode(body.match(/<loc>(.*?)<\/loc>/)[1]),
  alternates: Object.fromEntries([...body.matchAll(/<xhtml:link\b[^>]*\/>/g)].map(([tag]) => { const a=attributes(tag); return [a.hreflang,a.href]; })),
}));
const pages = new Map(await Promise.all(urls.map(async row => {
  const path = row.loc.slice(base.length);
  const html = await readFile(join(site,path,'index.html'),'utf8');
  const head = html.match(/<head>([\s\S]*?)<\/head>/i)?.[1];
  assert.ok(head,row.loc);
  const links = [...head.matchAll(/<link\b[^>]*>/g)].map(([tag])=>attributes(tag));
  const metas = [...head.matchAll(/<meta\b[^>]*>/g)].map(([tag])=>attributes(tag));
  return [row.loc,{html,head,links,metas,lang:html.match(/<html\b[^>]*lang="([^"]+)"/)[1]}];
})));

test('every sitemap URL agrees with its static canonical, language and reciprocal HTML/sitemap alternates', () => {
  assert.equal(new Set(urls.map(row=>row.loc)).size,urls.length,'duplicate sitemap URL');
  for(const row of urls){
    assert.ok(row.loc.startsWith(base),row.loc);
    const u = new URL(row.loc);
    assert.equal(u.search,'',row.loc); assert.equal(u.hash,'',row.loc);
    const page=pages.get(row.loc);
    assert.deepEqual(page.links.filter(link=>link.rel==='canonical').map(link=>link.href),[row.loc]);
    const alternates=Object.fromEntries(page.links.filter(link=>link.rel==='alternate'&&link.hreflang).map(link=>[link.hreflang,link.href]));
    assert.deepEqual(Object.keys(alternates).sort(),['en','es','x-default']);
    assert.deepEqual(alternates,row.alternates,row.loc);
    assert.equal(alternates[page.lang],row.loc);
    assert.equal(alternates['x-default'],alternates.es);
    for(const lang of ['es','en']){
      const alternate=pages.get(alternates[lang]);
      assert.ok(alternate,`alternate missing from sitemap: ${alternates[lang]}`);
      assert.equal(alternate.lang,lang);
      assert.ok(alternate.links.some(link=>link.rel==='alternate'&&link.hreflang===page.lang&&link.href===row.loc),`missing return link: ${row.loc}`);
    }
  }
});

test('indexable pages provide static descriptive metadata and valid JSON-LD without unresolved template tokens', () => {
  for(const [url,page] of pages){
    const title=decode(page.head.match(/<title>(.*?)<\/title>/s)?.[1]??'');
    assert.ok(title.trim().length>10,url);
    const description=page.metas.find(meta=>meta.name==='description')?.content;
    assert.ok(description?.trim().length>30,url);
    assert.ok(page.metas.some(meta=>meta.name==='robots'&&meta.content==='index,follow'),url);
    assert.equal(page.metas.some(meta=>meta.name==='robots'&&/noindex|nofollow/.test(meta.content)),false,url);
    assert.equal(page.metas.find(meta=>meta.property==='og:url')?.content,url);
    assert.equal(page.head.includes('__CANONICAL_URL__'),false,url);
    const scripts=[...page.head.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)];
    assert.ok(scripts.length>0,url);
    for(const [,raw] of scripts){const structured=JSON.parse(raw);assert.equal(structured['@context'],'https://schema.org');assert.ok(structured['@type'],url);}
  }
});

test('editorial and learning canonicals have crawlable body links to their translated counterpart and home', () => {
  for(const [url,page] of pages){
    if(url===base||url===base+'en/')continue;
    const body=page.html.split('</head>')[1].replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');
    const targets=[...body.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(([,href])=>new URL(decode(href),url).href);
    const other=page.lang==='es'?'en':'es';
    const alternate=page.links.find(link=>link.hreflang===other).href;
    assert.ok(targets.includes(alternate),`${url}: missing language-switch body link`);
    assert.ok(targets.includes(page.lang==='es'?base:base+'en/'),`${url}: missing home link`);
  }
});

test('404 page stays out of sitemap and carries explicit noindex', async () => {
  const html=await readFile(join(site,'404.html'),'utf8');
  assert.match(html,/<meta name="robots" content="noindex">/);
  assert.equal(urls.some(row=>row.loc.endsWith('404.html')),false);
});


test('both homepages ship readable editorial HTML and crawlable local and official links before JavaScript', async () => {
  const catalogue = JSON.parse(await readFile(join(root, 'src/content/official-sources.json'), 'utf8'));
  for (const lang of ['es', 'en']) {
    const url = lang === 'es' ? base : base + 'en/';
    const {html} = pages.get(url);
    const portal = html.split('<div id="editorial-portal">')[1]?.split('id="data-explorer"')[0];
    assert.ok(portal, url);
    assert.ok(portal.includes(`data-portal-fallback="${lang}"`), url);
    assert.match(portal, /<h1>/);
    const targets = [...portal.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(([, href]) => new URL(decode(href), url).href);
    for (const path of (lang === 'es' ? ['biblioteca/', 'skills/', 'temas/'] : ['library/', 'skills/', 'topics/'])) {
      assert.ok(targets.includes(url + path), url + path);
    }
    for (const item of catalogue.items) assert.ok(targets.includes(item.url), item.url);
    assert.equal(html.includes('__OBSERVATORY_PORTAL_FALLBACK__'), false, url);
  }
});

test('homepage publisher identifies the author separately from academic affiliation and displays the approved seal', () => {
  for (const url of [base, base + 'en/']) {
    const page = pages.get(url);
    const structured = JSON.parse(page.head.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
    assert.equal(structured.publisher['@type'], 'Person');
    assert.equal(structured.publisher.name, 'César David Rincón Godoy');
    assert.equal(structured.author.affiliation.name, 'Broward International University');
    assert.equal(page.metas.find(meta => meta.name === 'DC.publisher')?.content, structured.publisher.name);
    assert.match(page.html, /class="brand-mark"[^>]+observatorio-sello\.webp" width="72" height="72"/);
    assert.match(page.html, /class="about-seal"[^>]+observatorio-sello\.webp" width="180" height="180"/);
  }
});
