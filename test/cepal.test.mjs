import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {normalizeCepal, assertCepalCoverage, importCepal} from '../src/import-cepal.mjs';

const source = {id: 'school', indicator_id: 3816, category_dimension_id: 74607, report_dimension_id: 74389,
  null_note_ids: [12256], url: 'https://api-cepalstat.cepal.org/cepalstat/api/v1/indicator/3816/data?lang=es',
  origin: 'ODS/UIS', title: {es: 'Escuelas', en: 'Schools'}, note: {es: 'Contexto', en: 'Context'}};
function fixture() {
  return {header: {success: true, code: 200, timestamp: 1792545026}, footer: {records: 2, ip: 'PRIVATE_CLIENT_IP'},
    body: {metadata: {indicator_id: 3816, indicator_name: 'Escuelas', unit: 'Porcentaje', last_update: 'Jun 1 2026'},
      dimensions: [
        {id: 208, members: [{id: 240, name: 'Nicaragua'}, {id: 212, name: 'América Latina y el Caribe'}]},
        {id: 29117, members: [{id: 1, name: '2022'}]},
        {id: 74607, members: [{id: 74609, name: 'Secundaria básica'}]},
        {id: 74389, members: [{id: 74391, name: 'Global'}]}
      ], sources: [{id: 1, description: 'Public source', organization_name: 'UIS'}],
      footnotes: [{id: 12256, description: 'Este punto de datos es nulo para la nación de envío.'}],
      data: [
        {value: '0', source_id: 1, notes_ids: '12256', iso3: 'NIC', dim_208: 240, dim_29117: 1, dim_74607: 74609, dim_74389: 74391},
        {value: '0', source_id: null, notes_ids: '', iso3: null, dim_208: 212, dim_29117: 1, dim_74607: 74609, dim_74389: 74391}
      ]}};
}
test('CEPAL source null note overrides zero, preserving the literal API value and a real zero', () => {
  const {series, observations} = normalizeCepal(fixture(), source, 2026);
  const missing = observations.find(row => row.iso3 === 'NIC');
  const realZero = observations.find(row => row.iso3 === null);
  assert.equal(missing.value, null); assert.equal(missing.raw_value, '0');
  assert.equal(missing.missing_reason, 'source_note_12256');
  assert.equal(realZero.value, 0); assert.equal(realZero.geography_type, 'aggregate');
  assert.equal(realZero.source_id, null); assert.equal(missing.category_en, 'Lower secondary');
  assert.deepEqual([series.summary.records, series.summary.non_null, series.summary.missing], [2, 1, 1]);
  assert.equal(series.summary.countries_and_territories, 1);
});
test('CEPAL rejects duplicates, invalid percentages, unknown notes and unfinished responses', () => {
  const duplicate = fixture(); duplicate.body.data.push({...duplicate.body.data[0]}); duplicate.footer.records++;
  assert.throws(() => normalizeCepal(duplicate, source, 2026), /Duplicate/);
  for (const value of [-1, 101, 'not a number', true, [], {}]) {
    const invalid = fixture(); invalid.body.data[1].value = value;
    assert.throws(() => normalizeCepal(invalid, source, 2026), /percentage/);
  }
  const unknown = fixture(); unknown.body.data[0].notes_ids = '999';
  assert.throws(() => normalizeCepal(unknown, source, 2026), /Unknown.*note/);
  const incomplete = fixture(); incomplete.footer.records = 3;
  assert.throws(() => normalizeCepal(incomplete, source, 2026), /record count/);
  const noFooter = fixture(); delete noFooter.footer;
  assert.throws(() => normalizeCepal(noFooter, source, 2026), /record count/);
  const noValue = fixture(); delete noValue.body.data[1].value;
  assert.throws(() => normalizeCepal(noValue, source, 2026), /value field/);
  const unsuccessful = fixture(); unsuccessful.header.success = false;
  assert.throws(() => normalizeCepal(unsuccessful, source, 2026), /success/);
});
test('CEPAL validates series identity, dimensions and observation years', () => {
  const wrong = fixture(); wrong.body.metadata.indicator_id = 4052;
  assert.throws(() => normalizeCepal(wrong, source, 2026), /indicator/);
  const future = fixture(); future.body.dimensions[1].members[0].name = '2027';
  assert.throws(() => normalizeCepal(future, source, 2026), /year/);
  const unexpected = fixture(); unexpected.body.data[0].dim_999 = 1;
  assert.throws(() => normalizeCepal(unexpected, source, 2026), /Unexpected.*dimension/);
  const missingDimension = fixture(); missingDimension.body.dimensions.pop();
  assert.throws(() => normalizeCepal(missingDimension, source, 2026), /dimension missing/);
});
test('CEPAL does not replace existing non-null observations with a reduced response', () => {
  const {series} = normalizeCepal(fixture(), source, 2026);
  assert.doesNotThrow(() => assertCepalCoverage({series: [series]}, {series: [series]}));
  assert.throws(() => assertCepalCoverage({series: [series]}, {series: [{observations: []}]}), /coverage regression/);
});
test('CEPAL importer preserves the processed file on HTTP failure and sanitizes raw snapshots on success', async () => {
  const root = await mkdtemp(join(tmpdir(), 'cepal-import-test-'));
  try {
    await mkdir(join(root, 'config')); await mkdir(join(root, 'data/processed'), {recursive: true});
    const configs = [3816, 4052, 4891].map((id, index) => ({...source, id: 'series-' + index, indicator_id: id}));
    await writeFile(join(root, 'config/cepal-sources.json'), JSON.stringify({sources: configs}));
    const target = join(root, 'data/processed/cepal-context.json');
    await writeFile(target, JSON.stringify({series: []}));
    const before = await readFile(target, 'utf8');
    await assert.rejects(() => importCepal({root, retrievedAt: '2026-10-20T00:00:00Z', fetchImpl: async () => ({ok: false, status: 503})}), /HTTP 503/);
    assert.equal(await readFile(target, 'utf8'), before);
    let index = 0;
    const candidate = await importCepal({root, retrievedAt: '2026-10-20T00:00:00Z', fetchImpl: async () => {
      const body = fixture(); body.body.metadata.indicator_id = configs[index++].indicator_id;
      return {ok: true, text: async () => JSON.stringify(body)};
    }});
    assert.equal(candidate.series.length, 3); assert.equal(candidate.source_runs[0].mode, 'live_api');
    const raw = await readFile(join(root, 'data/raw/cepal-3816.json'), 'utf8');
    assert.equal(raw.includes('PRIVATE_CLIENT_IP'), false); assert.equal(raw.includes('"ip"'), false);
    assert.equal((await readFile(target, 'utf8')).includes('PRIVATE_CLIENT_IP'), false);
  } finally { await rm(root, {recursive: true, force: true}); }
});
