import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import vm from 'node:vm';
import {packageJourney} from '../src/package-journey.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const base='https://rinconcd67.github.io/observatorio-ia-educacion-empresa/';
const source=await readFile(join(root,'src/journey/journey.js'),'utf8');
const context=vm.createContext({});vm.runInContext(source,context);
const {checkExercise,checkQuiz,createState}=context.ObservatoryJourney;
const pages=[];
await packageJourney({root,base,save:async(...args)=>pages.push(args)});

test('Journey emits reciprocal ES/EN routes and working local destinations without needing a site build',async()=>{
 assert.equal(pages.length,2);
 const topics=JSON.parse(await readFile(join(root,'src/content/topics.json'),'utf8'));
 assert.ok(topics.some(x=>x.id==='ai-education'));
 assert.ok(topics.some(x=>x.id==='ai-business'));
 for(const [path,alternate,lang,title,description,body,structured] of pages){
  assert.equal(alternate,lang==='es'?'en/start/':'empieza/');
  assert.equal(path,lang==='es'?'empieza/':'en/start/');
  assert.ok(title&&description);assert.equal(structured.url,base+path);
  assert.equal(structured.timeRequired,'PT15M');
  assert.equal((body.match(/<h1>/g)||[]).length,1);
  assert.equal((body.match(/data-step="/g)||[]).length,4);
  assert.equal((body.match(/data-question-feedback role=/g)||[]).length,3);
  const localHrefs=[...body.matchAll(/href="([^"]+)"/g)].map(x=>x[1]).filter(x=>!x.startsWith('https:'));
  const expected=lang==='es'?['temas/ai-education/','temas/ai-business/','biblioteca/','skills/']:['en/topics/ai-education/','en/topics/ai-business/','en/library/','en/skills/'];
  assert.deepEqual(localHrefs.map(href=>new URL(href,base+path).href),expected.map(path=>base+path));
  assert.ok(body.includes('<noscript>'));assert.ok(body.includes('data-actions hidden'));
  assert.equal((body.match(/data-error-option value=/g)||[]).length,4);
  assert.equal((body.match(/data-quiz-option name=/g)||[]).length,9);
  assert.ok(!body.includes('<form')); // No native form submission even without JavaScript.
 }
});

test('Exercise requires precisely both unsupported inferences, not an empty or over-inclusive selection',()=>{
 for(const answers of [undefined,[],['population'],['learning'],['population','arithmetic'],['population','learning','usage'],['population','population']])assert.equal(checkExercise(answers),false);
 assert.equal(checkExercise(['population','learning']),true);
 assert.equal(checkExercise(['learning','population']),true);
});

test('Quiz rejects empty and partially wrong answers; each question gets its own result',()=>{
 assert.deepEqual(Array.from(checkQuiz([])),[false,false,false]);
 assert.deepEqual(Array.from(checkQuiz(['b','','c'])),[true,false,true]);
 assert.deepEqual(Array.from(checkQuiz(['b','b','c'])),[true,false,true]);
 assert.deepEqual(Array.from(checkQuiz(['b','a','c'])),[true,true,true]);
});

test('A visitor can finish without typing, selecting answers or receiving a grade',()=>{
 const state=createState();
 for(let step=0;step<4;step++)assert.equal(state.next(),true);
 assert.equal(state.complete,true);
 assert.equal(state.exercise,false);assert.equal(state.quiz,false);
 assert.equal(state.go(2),true);assert.equal(state.complete,false);
 for(const page of pages){
  assert.doesNotMatch(page[5],/<textarea|type="text"|journey-writing/);
  assert.ok(page[5].includes('data-show-model'));
  assert.ok(page[5].includes('data-show-answers'));
 }
});

test('Incorrect and edited answers retain honest feedback without blocking progression',()=>{
 const state=createState();state.next();state.next();
 assert.equal(state.assessExercise(['arithmetic']),false);
 assert.equal(state.next(),true);
 assert.equal(state.assessQuiz(['a','b','a']),false);
 assert.equal(state.next(),true);assert.equal(state.complete,true);
 assert.equal(state.go(2),true);
 assert.equal(state.assessExercise(['population','learning']),true);
 state.invalidateExercise();assert.equal(state.exercise,false);
 assert.equal(state.next(),true);
 assert.equal(state.assessQuiz(['b','a','c']),true);
 state.invalidateQuiz();assert.equal(state.quiz,false);
 assert.equal(state.next(),true);
 const reset=createState();assert.equal(reset.step,0);assert.equal(reset.complete,false);
});

test('Journey processing uses no network or persistent browser storage',()=>{
 assert.doesNotMatch(source,/\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|indexedDB)\b|document\.cookie/);
 for(const [, ,lang,,,body] of pages){
  assert.ok(body.includes(lang==='es'?'CASO COMPLETAMENTE FICTICIO':'ENTIRELY FICTIONAL CASE'));
  assert.ok(body.includes(lang==='es'?'no se han calificado tus elecciones':'your choices have not been graded'));
  assert.ok(body.includes(lang==='es'?'no acredita una competencia':'does not certify competence'));
 }
});
