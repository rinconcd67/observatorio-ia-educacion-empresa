import {readFile, writeFile, mkdir, rename, unlink} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dirname, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HASH = value => createHash('sha256').update(value).digest('hex');
const CATEGORY_EN = {
  'Quintil 1 (Menores ingresos)': 'Quintile 1 (Lowest income)', 'Quintil 2': 'Quintile 2',
  'Quintil 3': 'Quintile 3', 'Quintil 4': 'Quintile 4', 'Quintil 5 (Mayores ingresos)': 'Quintile 5 (Highest income)',
  Total: 'Total', Rural: 'Rural', Urbano: 'Urban', Primaria: 'Primary', Secundaria: 'Secondary',
  'Secundaria básica': 'Lower secondary', 'Secundaria superior': 'Upper secondary'
};
const plain = value => String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const populated = value => typeof value === 'string' && value.trim().length > 0;

export function observationKey(row) {
  return [row.metric_id, row.geography_id, row.year, row.category_id, row.report_type_id ?? ''].join('|');
}

/** Null notes take precedence over a numeric API value, including zero. */
export function normalizeCepal(document, source, asOfYear = new Date().getUTCFullYear()) {
  if (!Number.isInteger(asOfYear) || asOfYear < 1900) throw Error('Invalid CEPAL reference year');
  if (document?.header?.success !== true || Number(document?.header?.code) !== 200) throw Error('CEPAL API did not report success');
  const body = document.body;
  if (!body || !Array.isArray(body.data) || !body.data.length || !Array.isArray(body.dimensions) || !Array.isArray(body.sources) || !Array.isArray(body.footnotes)) throw Error('Incomplete CEPAL response');
  if (Number(body.metadata?.indicator_id) !== source.indicator_id || !populated(body.metadata?.unit) || !/porcentaje/i.test(body.metadata.unit)) throw Error('Unexpected CEPAL indicator or unit');
  if (!Number.isInteger(document.footer?.records) || document.footer.records !== body.data.length) throw Error('Incomplete CEPAL record count');
  const dimensionIds = [208, 29117, source.category_dimension_id, ...(source.report_dimension_id ? [source.report_dimension_id] : [])];
  const dimensions = new Map();
  for (const id of dimensionIds) {
    const dimension = body.dimensions.find(d => Number(d.id) === id);
    if (!dimension || !Array.isArray(dimension.members) || !dimension.members.length) throw Error('CEPAL dimension missing: ' + id);
    const values = new Map();
    for (const member of dimension.members) {
      if (!Number.isInteger(Number(member.id)) || !populated(member.name) || values.has(Number(member.id))) throw Error('Invalid CEPAL dimension member');
      values.set(Number(member.id), member.name.trim());
    }
    dimensions.set(id, values);
  }
  const notes = new Map(body.footnotes.map(note => [Number(note.id), plain(note.description)]));
  const sources = new Set(body.sources.map(item => Number(item.id)));
  const seen = new Set();
  const observations = body.data.map(row => {
    const expectedKeys = new Set(dimensionIds.map(id => 'dim_' + id));
    if (Object.keys(row).some(key => key.startsWith('dim_') && !expectedKeys.has(key))) throw Error('Unexpected CEPAL dimension in observation');
    const member = id => {
      const value = dimensions.get(id).get(Number(row['dim_' + id]));
      if (!value) throw Error('Unknown CEPAL dimension member');
      return value;
    };
    const country = member(208), yearText = member(29117), category = member(source.category_dimension_id);
    if (!/^(19|20)\d{2}$/.test(yearText) || Number(yearText) > asOfYear) throw Error('Invalid CEPAL observation year');
    if (row.iso3 !== undefined && row.iso3 !== null && row.iso3 !== '' && !/^[A-Z]{3}$/.test(row.iso3)) throw Error('Invalid CEPAL ISO3');
    if (row.source_id !== null && row.source_id !== undefined && !sources.has(Number(row.source_id))) throw Error('Unknown CEPAL source');
    const noteIds = row.notes_ids === '' || row.notes_ids === undefined || row.notes_ids === null ? [] : String(row.notes_ids).split(/[,;]+/).map(id => Number(id.trim()));
    if (noteIds.some(id => !Number.isInteger(id) || !notes.has(id))) throw Error('Unknown CEPAL observation note');
    const missingNote = noteIds.find(id => (source.null_note_ids || []).includes(id));
    if (!Object.hasOwn(row, 'value') || (row.value !== null && !['string', 'number'].includes(typeof row.value))) throw Error('Invalid CEPAL percentage value field');
    const rawMissing = row.value === null || row.value === undefined || (typeof row.value === 'string' && ['', '..', '...', 'NA', 'N/A'].includes(row.value.trim()));
    const rawNumeric = rawMissing ? null : Number(row.value);
    if (!rawMissing && (typeof row.value === 'boolean' || !Number.isFinite(rawNumeric) || rawNumeric < 0 || rawNumeric > 100)) throw Error('Invalid CEPAL percentage');
    const value = missingNote || rawMissing ? null : rawNumeric;
    const observation = {
      metric_id: source.id, indicator_id: source.indicator_id, geography_id: Number(row.dim_208),
      iso3: row.iso3 || null, country, geography_type: row.iso3 ? 'country_or_territory' : 'aggregate',
      year: Number(yearText), category_id: Number(row['dim_' + source.category_dimension_id]), category,
      category_en: CATEGORY_EN[category] || category, value, raw_value: row.value ?? null, unit: 'percent',
      source_id: row.source_id === null || row.source_id === undefined ? null : Number(row.source_id), notes: noteIds.map(id => ({id, description: notes.get(id)})),
      missing_reason: missingNote ? 'source_note_' + missingNote : rawMissing ? 'source_missing_value' : null,
      ...(source.report_dimension_id ? {report_type_id: Number(row['dim_' + source.report_dimension_id]), report_type: member(source.report_dimension_id)} : {})
    };
    const key = observationKey(observation);
    if (seen.has(key)) throw Error('Duplicate CEPAL observation');
    seen.add(key);
    return observation;
  }).sort((a,b) => observationKey(a).localeCompare(observationKey(b)));
  if (!observations.some(row => row.value !== null)) throw Error('CEPAL response contains no usable observations');
  const years = observations.map(row => row.year);
  const countryCodes = [...new Set(observations.map(row => row.iso3).filter(Boolean))].sort();
  return {
    series: {
      id: source.id, indicator_id: source.indicator_id, title: source.title, note: source.note, unit: 'percent',
      official_title: plain(body.metadata.indicator_name), definition: plain(body.metadata.definition),
      calculation_methodology: plain(body.metadata.calculation_methodology), origin: source.origin,
      source_updated_at: plain(body.metadata.last_update), source_url: source.url,
      sources: body.sources.map(item => ({id: Number(item.id), description: plain(item.description), organization: plain(item.organization_name), organization_acronym: plain(item.organization_acronym)})),
      summary: {records: observations.length, non_null: observations.filter(row => row.value !== null).length,
        missing: observations.filter(row => row.value === null).length, countries_and_territories: countryCodes.length,
        country_codes: countryCodes, aggregate_records: observations.filter(row => row.geography_type === 'aggregate').length,
        min_year: Math.min(...years), max_year: Math.max(...years)}, observations
    }, observations
  };
}

export function assertCepalCoverage(previous, candidate) {
  if (!previous) return;
  if (!Array.isArray(previous.series) || !Array.isArray(candidate.series)) throw Error('Invalid CEPAL coverage snapshot');
  const oldRows = previous.series.flatMap(series => series.observations || []);
  const newRows = candidate.series.flatMap(series => series.observations || []);
  const keys = new Set(newRows.filter(row => row.value !== null).map(observationKey));
  if (oldRows.some(row => row.value !== null && !keys.has(observationKey(row)))) throw Error('CEPAL coverage regression; previous snapshot preserved');
}

export async function importCepal({root = ROOT, fetchImpl = fetch, offlineDirectory = null, retrievedAt = new Date().toISOString()} = {}) {
  const config = JSON.parse(await readFile(resolve(root, 'config/cepal-sources.json'), 'utf8'));
  if (config.sources.length !== 3 || new Set(config.sources.map(source => source.id)).size !== 3 || new Set(config.sources.map(source => source.indicator_id)).size !== 3) throw Error('CEPAL requires three distinct configured series');
  if (!Number.isFinite(new Date(retrievedAt).getTime())) throw Error('Invalid CEPAL retrieval timestamp');
  const series = [], sourceRuns = [], rawSnapshots = [];
  for (const source of config.sources) {
    let raw, mode, fetchedAt;
    if (offlineDirectory) {
      raw = await readFile(resolve(offlineDirectory, 'cepalstat-' + source.indicator_id + '-data.json'), 'utf8');
      mode = 'review_snapshot';
      const document = JSON.parse(raw);
      if (!Number.isFinite(Number(document.header?.timestamp))) throw Error('Offline CEPAL snapshot has no retrieval timestamp');
      fetchedAt = new Date(Number(document.header.timestamp) * 1000).toISOString();
    } else {
      const response = await fetchImpl(source.url, {signal: AbortSignal.timeout(45000), headers: {Accept: 'application/json'}});
      if (!response.ok) throw Error('CEPAL HTTP ' + response.status + '; previous snapshot preserved');
      raw = await response.text(); mode = 'live_api'; fetchedAt = new Date().toISOString();
    }
    const document = JSON.parse(raw);
    const normalized = normalizeCepal(document, source, new Date(retrievedAt).getUTCFullYear());
    series.push(normalized.series);
    // Only the official public fields are retained. API footer IP and server identifiers are excluded.
    const publicSnapshot = JSON.stringify({schema_version: 1, indicator_id: source.indicator_id, retrieved_at: fetchedAt,
      header: {success: document.header.success, code: document.header.code, timestamp: document.header.timestamp, version: document.header.version},
      body: document.body, footer: {records: document.footer?.records ?? document.body.data.length}}, null, 2) + '\n';
    sourceRuns.push({id: source.id, indicator_id: source.indicator_id, url: source.url, mode, retrieved_at: fetchedAt,
      response_sha256: HASH(raw), response_bytes: Buffer.byteLength(raw), snapshot_sha256: HASH(publicSnapshot), snapshot_bytes: Buffer.byteLength(publicSnapshot),
      raw_snapshot: 'data/raw/cepal-' + source.indicator_id + '.json', source_updated_at: normalized.series.source_updated_at, observations: normalized.observations.length});
    rawSnapshots.push({id: source.indicator_id, content: publicSnapshot});
  }
  const candidate = {schema_version: 1, retrieved_at: retrievedAt, scope: 'context_only_not_ai_adoption',
    api_documentation: config.api_documentation, license_note: 'Public official data, with attribution and original sources retained. See CEPAL terms and series metadata before reuse.',
    series, source_runs: sourceRuns};
  const target = resolve(root, 'data/processed/cepal-context.json');
  let previous;
  try { previous = JSON.parse(await readFile(target, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  assertCepalCoverage(previous, candidate);
  await mkdir(resolve(root, 'data/raw'), {recursive: true});
  await mkdir(dirname(target), {recursive: true});
  // No processed snapshot is replaced until every response and the coverage gate have passed.
  for (const snapshot of rawSnapshots) await writeFile(resolve(root, 'data/raw/cepal-' + snapshot.id + '.json'), snapshot.content);
  const temporary = target + '.tmp';
  try { await writeFile(temporary, JSON.stringify(candidate, null, 2) + '\n'); await rename(temporary, target); }
  catch (error) { await unlink(temporary).catch(() => {}); throw error; }
  return candidate;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  const offline = args.indexOf('--offline');
  if (args.some((arg,index) => index !== offline && index !== offline + 1 && offline !== -1) || (offline === -1 && args.length) || (offline !== -1 && !args[offline + 1])) {
    console.error('Usage: node src/import-cepal.mjs [--offline DIRECTORY]'); process.exitCode = 1;
  } else importCepal({offlineDirectory: offline === -1 ? null : resolve(args[offline + 1])}).then(data => console.log(JSON.stringify({series: data.series.length, observations: data.series.reduce((sum,series) => sum + series.summary.records, 0), non_null: data.series.reduce((sum,series) => sum + series.summary.non_null, 0), missing: data.series.reduce((sum,series) => sum + series.summary.missing, 0)}))).catch(error => {console.error(error.message); process.exitCode = 1;});
}
