import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {normalize,retrieve} from '../src/import-cima.mjs';
import {normalizeFinance} from '../src/import-education-finance.mjs';
const cima=JSON.parse(await readFile(new URL('../data/processed/cima-context.json',import.meta.url)));
const finance=JSON.parse(await readFile(new URL('../data/processed/education-finance.json',import.meta.url)));
const rawRows=cima.source_runs.flatMap(r=>JSON.parse(r.raw).result.records);
const names=new Map(cima.observations.map(r=>[r.iso3,r.country]));
test('CIMA raw bytes reproduce selected national observations and exclude aggregates',()=>{
 for(const run of cima.source_runs)assert.equal(createHash('sha256').update(run.raw).digest('hex'),run.sha256);
 assert.deepEqual(normalize(rawRows,names),cima.observations);
 assert.ok(cima.observations.every(r=>!['LAC','OECD'].includes(r.iso3)));
});
test('CIMA rejects mixed populations, duplicates and null values',()=>{
 const r=rawRows.find(r=>names.has(r.isoalpha3));
 for(const bad of [{...r,sex:'Female'},{...r,value:null},{...r,source:'PISA-D'}])assert.throws(()=>normalize([bad],names));
 assert.throws(()=>normalize([r,r],names));
});
test('CIMA refuses failed and incomplete API responses',async()=>{
 await assert.rejects(retrieve(async()=>new Response('blocked',{status:403})));
 await assert.rejects(retrieve(async()=>new Response(JSON.stringify({success:true,result:{resource_id:cima.resource_id,total:2,records:[]}}))));
});
test('Finance raw response hashes and null preservation',()=>{
 const rows=finance.source_runs.flatMap(r=>{assert.equal(createHash('sha256').update(r.raw).digest('hex'),r.sha256);return JSON.parse(r.raw)[1];});
 assert.deepEqual(normalizeFinance(rows),finance.observations);
 assert.ok(finance.observations.some(r=>r.value===null));
 const r=rows[0];assert.throws(()=>normalizeFinance([r,r]));assert.throws(()=>normalizeFinance([{...r,value:-1}]));
});
