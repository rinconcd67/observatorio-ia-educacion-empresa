import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
const d=JSON.parse(await readFile(new URL('../data/processed/education-evidence.json',import.meta.url)));
test('cada observación docente conserva población TALIS y fuente nacional',()=>{
 assert.equal(d.integrated_into_global_metrics,false);
 assert.equal(d.observations.length,8);
 const keys=new Set();
 for(const r of d.observations){
  assert.equal(r.population,'ISCED_2_teachers');assert.equal(r.year,2024);assert.equal(r.comparability_group,'talis2024_isced2');
  assert.ok(Number.isFinite(r.value)&&r.value>=0&&r.value<=100);
  assert.ok(d.sources.some(s=>s.id===r.source_id&&new URL(s.url).hostname==='www.oecd.org'));
  const k=[r.iso3,r.metric_id,r.year].join('|');assert.ok(!keys.has(k));keys.add(k);
 }
 for(const iso of new Set(d.observations.map(r=>r.iso3)))assert.equal(d.observations.filter(r=>r.iso3===iso).length,2);
});
test('capa institucional no se confunde con docentes ni resultados de aprendizaje',()=>{
 assert.equal(d.institutional.length,2);
 for(const r of d.institutional){assert.equal(r.population,'schools_basic_education_brazil');assert.equal(r.year,2025);assert.equal(r.fieldwork,'2025-08/2026-04');assert.ok(d.sources.some(s=>s.id===r.methodology_source_id));}
 assert.equal(d.learning_outcomes_status,'not_integrated');
 assert.equal(d.resources.find(r=>r.role==='teacher_training_framework').competencies,15);
});
test('fuentes complementarias identificables y con enlaces HTTPS oficiales',()=>{
 const hosts=new Set(['www.oecd.org','cetic.br','www.unesco.org','www.iadb.org']);
 const ids=new Set();for(const s of d.sources){assert.ok(!ids.has(s.id));ids.add(s.id);const u=new URL(s.url);assert.equal(u.protocol,'https:');assert.ok(hosts.has(u.hostname));assert.ok(s.locator&&s.publisher);}
});
