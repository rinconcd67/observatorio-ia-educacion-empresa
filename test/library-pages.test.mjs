import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const site=join(root,'_site');
const base='https://rinconcd67.github.io/observatorio-ia-educacion-empresa/';
async function files(dir){const out=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())out.push(...await files(p));else if(e.name.endsWith('.html'))out.push(p);}return out;}
const editorial=(await files(site)).filter(p=>/\/(biblioteca|library|temas|topics)\//.test(p));
test('all 34 editorial pages expose readable static content, one heading and valid JSON-LD',async()=>{
 assert.equal(editorial.length,34);
 for(const p of editorial){const html=await readFile(p,'utf8');assert.equal((html.match(/<h1[ >]/g)||[]).length,1,p);assert.ok(!html.includes('undefined'),p);for(const m of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs))assert.ok(JSON.parse(m[1])['@type']);assert.ok(html.includes('review')||html.includes('revisión')||html.includes('Revisión')||html.includes('GUÍAS'),p);}
});
test('editorial links resolve under GitHub Pages subpath and language alternates return reciprocally',async()=>{
 for(const p of editorial){const html=await readFile(p,'utf8');const path=p.slice(site.length+1).replace(/index.html$/,'');const url=base+path;const canonical=html.match(/rel="canonical" href="([^"]+)"/)[1];assert.equal(canonical,url);
 for(const [,raw] of html.matchAll(/href="([^"]+)"/g)){const target=new URL(raw.replaceAll('&amp;','&'),url);if(target.origin!==new URL(base).origin)continue;assert.ok(target.href.startsWith(base),`${p}: ${raw}`);let dest=decodeURIComponent(target.pathname.slice(new URL(base).pathname.length));if(!dest||dest.endsWith('/'))dest+='index.html';assert.ok((await stat(join(site,dest))).isFile(),`${p}: ${raw}`);}
 const lang=html.match(/<html lang="(.*?)"/)[1],other=lang==='es'?'en':'es';const alternate=html.match(new RegExp(`hreflang="${other}" href="([^"]+)"`))[1];const back=await readFile(join(site,alternate.slice(base.length),'index.html'),'utf8');assert.ok(back.includes(`hreflang="${lang}" href="${url}"`),p);
 }
});
test('sitemap contains all editorial canonicals and the two observatory language roots',async()=>{
 const xml=await readFile(join(site,'sitemap.xml'),'utf8');const locs=[...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);assert.equal(locs.length,36);assert.equal(new Set(locs).size,36);for(const p of editorial)assert.ok(locs.includes(base+p.slice(site.length+1).replace(/index.html$/,'')));
});
test('publication records retain source-language and review-scope disclosures in both languages',async()=>{
 const c=JSON.parse(await readFile(join(root,'data/processed/library.json'),'utf8'));
 for(const item of c.items)for(const l of ['es','en']){const p=join(site,l==='es'?'biblioteca':'en/library',item.id,'index.html');const html=await readFile(p,'utf8');assert.ok(html.includes(item.source_url.replaceAll('&','&amp;')));assert.ok(html.includes(l==='es'?'Idioma de la edición':'Edition language'));assert.ok(html.includes(l==='es'?'Ficha o resumen oficial':'Official record or summary'));}
});
