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

test('reintenta la descarga completa si el cuerpo se interrumpe tras las cabeceras', async () => {
  let calls = 0;
  const waits = [];
  const resource = await fetchResource('https://example.test/body', {
    fetchImpl: async () => {
      calls += 1;
      if (calls > 1) return new Response('complete');
      return new Response(new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('partial'));
          controller.error(new Error('body disconnected'));
        },
      }));
    },
    sleep: async (ms) => waits.push(ms),
  });
  assert.equal(calls, 2);
  assert.equal(resource.attempts, 2);
  assert.equal(new TextDecoder().decode(resource.bytes), 'complete');
  assert.deepEqual(waits, [1000]);
});

test('el timeout aborta un cuerpo bloqueado y agota los intentos configurados', async () => {
  let calls = 0;
  let abortedBodies = 0;
  const waits = [];
  await assert.rejects(fetchResource('https://example.test/stalled', {
    attempts: 2,
    timeoutMs: 10,
    fetchImpl: async (_url, { signal }) => {
      calls += 1;
      return new Response(new ReadableStream({
        start(controller) {
          signal.addEventListener('abort', () => {
            abortedBodies += 1;
            controller.error(signal.reason);
          }, { once: true });
        },
      }));
    },
    sleep: async (ms) => waits.push(ms),
  }), (error) => error.name === 'AbortError' && error.attempts === 2);
  assert.equal(calls, 2);
  assert.equal(abortedBodies, 2);
  assert.deepEqual(waits, [1000]);
});

test('recupera un cuerpo bloqueado sin conservar bytes parciales del intento anterior', async () => {
  let calls = 0;
  const resource = await fetchResource('https://example.test/recover', {
    timeoutMs: 10,
    fetchImpl: async (_url, { signal }) => {
      calls += 1;
      if (calls > 1) return new Response('recovered');
      return new Response(new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('partial'));
          signal.addEventListener('abort', () => controller.error(signal.reason), { once: true });
        },
      }));
    },
    sleep: async () => {},
  });
  assert.equal(resource.attempts, 2);
  assert.equal(new TextDecoder().decode(resource.bytes), 'recovered');
});

test('HTTP 500 persistente respeta el presupuesto configurado y no espera tras el último intento', async () => {
  let calls = 0;
  const waits = [];
  await assert.rejects(fetchResource('https://example.test/unavailable', {
    attempts: 5,
    retryBaseDelayMs: 15_000,
    retryMaxDelayMs: 60_000,
    fetchImpl: async () => { calls += 1; return new Response('', { status: 500 }); },
    sleep: async (ms) => waits.push(ms),
  }), (error) => error.status === 500 && error.attempts === 5);
  assert.equal(calls, 5);
  assert.deepEqual(waits, [15_000, 30_000, 60_000, 60_000]);
});

test('Retry-After prevalece sobre un máximo de backoff menor sin superar el límite de servicio', async () => {
  let calls = 0;
  const waits = [];
  const result = await fetchResource('https://example.test/rate-limit', {
    retryBaseDelayMs: 15_000,
    retryMaxDelayMs: 30_000,
    fetchImpl: async () => ++calls === 1
      ? new Response('', { status: 429, headers: { 'Retry-After': '45' } })
      : new Response('ok'),
    sleep: async (ms) => waits.push(ms),
  });
  assert.equal(result.attempts, 2);
  assert.deepEqual(waits, [45_000]);
});

test('rechaza retrasos configurados no enteros positivos antes de consultar la red', async () => {
  for (const key of ['retryBaseDelayMs', 'retryMaxDelayMs']) {
    for (const value of [0, -1, 1.5, NaN, Infinity, '1000']) {
      await assert.rejects(fetchResource('https://example.test/invalid', {
        [key]: value,
        fetchImpl: async () => { throw new Error('no debe consultar'); },
      }), (error) => error instanceof TypeError && error.message.includes(key));
    }
  }
});
