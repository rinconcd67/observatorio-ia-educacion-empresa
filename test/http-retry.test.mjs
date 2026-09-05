import assert from 'node:assert/strict';
import test from 'node:test';
import { fetchResource } from '../src/lib/http.mjs';

test('recupera HTTP 500 transitorio y registra intentos', async () => {
  let calls = 0; const waits=[];
  const r=await fetchResource('https://example.test/data',{fetchImpl:async()=>++calls===1 ? new Response('',{status:500}) : new Response('CSV'),sleep:async(ms)=>waits.push(ms)});
  assert.equal(r.status,200);assert.equal(r.attempts,2);assert.deepEqual(waits,[1000]);
});
test('respeta Retry-After 429 y no reintenta errores permanentes',async()=>{
  let calls=0;const waits=[];
  await fetchResource('https://example.test/data',{fetchImpl:async()=>++calls===1 ? new Response('',{status:429,headers:{'Retry-After':'3'}}) : new Response('ok'),sleep:async(ms)=>waits.push(ms)});
  assert.deepEqual(waits,[3000]);
  calls=0;
  await assert.rejects(fetchResource('https://example.test/data',{fetchImpl:async()=>{calls++;return new Response('',{status:404});},sleep:async()=>{throw Error('no debe esperar');}}),e=>e.status===404&&e.attempts===1);
  assert.equal(calls,1);
});
test('no reintenta antes de un Retry-After superior al límite del proceso',async()=>{
  await assert.rejects(fetchResource('https://example.test/data',{fetchImpl:async()=>new Response('',{status:429,headers:{'Retry-After':'120'}}),sleep:async()=>{throw Error('no debe esperar');}}),e=>e.status===429&&e.attempts===1);
});
