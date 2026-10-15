import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const base='https://rinconcd67.github.io/observatorio-ia-educacion-empresa/';
const catalogue=JSON.parse(await readFile(join(root,'data/processed/skills.json'),'utf8'));
async function pages(dir){const out=[];for(const entry of await readdir(dir,{withFileTypes:true})){const p=join(dir,entry.name);if(entry.isDirectory())out.push(...await pages(p));else if(entry.name==='index.html')out.push(p);}return out;}
const routeIds=['start','teach','work','build'];
test('Skills offers ten distinct verified records with Spanish/free priority and all four routes',()=>{
 assert.equal(catalogue.items.length,10);
 assert.equal(new Set(catalogue.items.map(x=>x.id)).size,10);
 assert.equal(new Set(catalogue.items.map(x=>x.source_url)).size,10);
 assert.ok(catalogue.items.filter(x=>x.language==='es'&&x.cost==='free').length>=7);
 for(const route of routeIds)assert.ok(catalogue.items.some(x=>x.routes.includes(route)),route);
 for(const item of catalogue.items){
  assert.match(item.verified_date,/^\d{4}-\d{2}-\d{2}$/);
  for(const url of [item.source_url,...item.evidence_urls])assert.equal(new URL(url).protocol,'https:');
  assert.ok(item.evidence_urls.length>0);
  for(const l of ['es','en'])for(const field of ['title','summary','access','credential','cost_note','prerequisites','duration','practice'])assert.ok(item[l][field]?.trim(),`${item.id}: ${l}.${field}`);
 }
});
test('Skills static content, internal links, canonical and language alternates work under the project subpath',async()=>{
 const site=join(root,'_site');
 const all=[...await pages(join(site,'skills')),...await pages(join(site,'en/skills'))];
 assert.equal(all.length,30);
 const sitemap=await readFile(join(site,'sitemap.xml'),'utf8');
 for(const p of all){
  const html=await readFile(p,'utf8');const url=base+p.slice(site.length+1).replace(/index.html$/,'');
  assert.equal((html.match(/<h1[ >]/g)||[]).length,1,p);
  assert.ok(!html.includes('undefined'),p);
  assert.ok(html.includes(`rel="canonical" href="${url}"`),p);
  assert.ok(sitemap.includes(`<loc>${url}</loc>`),p);
  for(const [,raw] of html.matchAll(/href="([^"]+)"/g)){
   const dest=new URL(raw.replaceAll('&amp;','&'),url);
   if(dest.origin!==new URL(base).origin)continue;
   assert.ok(dest.href.startsWith(base),`${p}: escaping project path ${raw}`);
   let local=dest.pathname.slice(new URL(base).pathname.length);if(!local||local.endsWith('/'))local+='index.html';
   assert.ok((await stat(join(site,local))).isFile(),`${p}: ${raw}`);
  }
  const lang=html.match(/<html lang="(.*?)"/)[1],other=lang==='es'?'en':'es';
  const alternate=html.match(new RegExp(`hreflang="${other}" href="([^"]+)"`))[1];
  const back=await readFile(join(site,alternate.slice(base.length),'index.html'),'utf8');
  assert.ok(back.includes(`hreflang="${lang}" href="${url}"`));
  for(const [,data] of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs))assert.ok(JSON.parse(data)['@type']);
 }
});
test('Every Skills record exposes original language, source and verification date in ES and EN',async()=>{
 for(const item of catalogue.items)for(const prefix of ['skills','en/skills']){
  const html=await readFile(join(root,'_site',prefix,item.id,'index.html'),'utf8');
  assert.ok(html.includes(item.source_url.replaceAll('&','&amp;')));
  assert.ok(html.includes(item.verified_date));
  assert.ok(html.includes(item.language==='es'?(prefix==='skills'?'Español':'Spanish'):(prefix==='skills'?'Inglés':'English')));
 }
});
