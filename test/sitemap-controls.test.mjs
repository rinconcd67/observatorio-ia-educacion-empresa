import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const site=join(dirname(fileURLToPath(import.meta.url)),'../_site');
const base='https://rinconcd67.github.io/observatorio-ia-educacion-empresa/';
const locations=xml=>[...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match=>match[1]);

test('diagnostic XML copy is byte-identical to the primary sitemap',async()=>{
 const [primary,copy]=await Promise.all(['sitemap.xml','sitemap-control.xml'].map(name=>readFile(join(site,name))));
 assert.deepEqual(copy,primary);
});

test('minimal XML and text controls contain exactly the primary public canonicals',async()=>{
 const [primary,simple,text]=await Promise.all(['sitemap.xml','sitemap-simple.xml','sitemap-control.txt'].map(name=>readFile(join(site,name),'utf8')));
 const urls=locations(primary);
 assert.ok(urls.length>0);
 assert.equal(new Set(urls).size,urls.length);
 assert.deepEqual(locations(simple),urls);
 assert.deepEqual(text.trimEnd().split('\n'),urls);
 assert.ok(simple.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'));
 assert.equal(simple.includes('xhtml:'),false);
 for(const url of urls){
  assert.ok(url.startsWith(base),url);
  assert.equal(new URL(url).search,'');
  assert.ok(!url.includes('sitemap-control')&&!url.includes('sitemap-simple'));
  assert.ok((await stat(join(site,url.slice(base.length),'index.html'))).isFile(),url);
 }
});
