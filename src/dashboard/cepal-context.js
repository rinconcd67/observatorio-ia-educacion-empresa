(() => {
  'use strict';
  const data = window.OBSERVATORY_CEPAL;
  const es = window.OBSERVATORY_LOCALE !== 'en';
  const lang = es ? 'es' : 'en';
  const t = (a, b) => es ? a : b;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const section = document.createElement('section');
  section.className = 'lac-evidence';
  section.id = 'cepal-context';
  section.innerHTML = `<p class="eyebrow">CEPAL / ECLAC · CEPALSTAT</p>
    <h2>${t('Conectividad para aprender y participar','Connectivity for learning and participation')}</h2>
    <p>${t('Tres series para comprender las condiciones de acceso digital en América Latina y el Caribe. Son datos de contexto: no miden habilidades ni adopción de IA.','Three series on digital access conditions in Latin America and the Caribbean. These context data do not measure skills or AI adoption.')}</p>
    <div class="cima-filters cepal-filters">
      <label>${t('Serie','Series')} <select id="cepal-series">${data.series.map(s => `<option value="${esc(s.id)}">${esc(s.title[lang])}</option>`).join('')}</select></label>
      <label>${t('Año observado','Observation year')} <select id="cepal-year"></select></label>
      <label>${t('Desagregación','Breakdown')} <select id="cepal-category"></select></label>
      <label>${t('Cobertura','Geography')} <select id="cepal-geography"><option value="country_or_territory">${t('Países y territorios','Countries and territories')}</option><option value="aggregate">${t('Agregados publicados por CEPAL','Aggregates published by ECLAC')}</option></select></label>
    </div>
    <p id="cepal-status" role="status" aria-live="polite"></p>
    <div class="table-scroll cepal-table-wrap"><table class="teacher-table"><caption id="cepal-caption"></caption><thead><tr><th scope="col">${t('País, territorio o agregado','Country, territory or aggregate')}</th><th scope="col">${t('Año','Year')}</th><th scope="col">${t('Desagregación','Breakdown')}</th><th scope="col">${t('Valor (%)','Value (%)')}</th><th scope="col">${t('Nota de la fuente','Source note')}</th></tr></thead><tbody id="cepal-rows"></tbody></table></div>
    <p class="evidence-limit">${t('— significa dato ausente. Dos valores escolares recibidos como 0 se conservan como ausencias porque la nota de CEPAL los identifica como nulos. La cobertura cambia por año y categoría; no se imputan datos ni se calculan promedios propios.','— means missing data. Two school values received as 0 are retained as missing because ECLAC marks them as null. Coverage varies by year and category; we do not impute data or calculate our own averages.')}</p>
    <details><summary>${t('Fuente, período y límites','Source, period and limitations')}</summary><div id="cepal-method"></div><p>${t('Internet en el hogar puede ser fijo o móvil y no equivale al uso individual. El acceso escolar no mide calidad de conexión, aprendizaje ni uso de IA. Los agregados son los publicados por la fuente y no se combinan con países.','Household Internet may be fixed or mobile and is not the same as individual use. School access does not measure connection quality, learning or AI use. Aggregates come from the source and are not combined with countries.')}</p><p>${t('La fecha de consulta no cambia el año observado. Estas series permanecen separadas de las mediciones de IA, PISA y gasto educativo.','Retrieval date does not change the observation year. These series remain separate from AI measures, PISA and education spending.')}</p></details>
    <p><a href="${es ? '' : '../'}data/cepal-context.json">${t('Descargar las tres series y su trazabilidad (JSON)','Download the three series and their provenance (JSON)')}</a> · <a href="${es ? 'biblioteca/' : 'library/'}cepal-cenia-ilia-2025/">${t('Leer ILIA 2025 en la biblioteca','Read ILIA 2025 in the library')}</a></p>`;
  document.getElementById('education-finance').after(section);
  const select = name => section.querySelector('#cepal-' + name);
  const current = () => data.series.find(s => s.id === select('series').value);
  function resetSeries() {
    const series = current();
    const years = [...new Set(series.observations.map(r => r.year))].sort((a, b) => b - a);
    select('year').innerHTML = years.map(y => `<option>${y}</option>`).join('');
    const categories = [...new Map(series.observations.map(r => [r.category_id, r])).values()];
    categories.sort((a, b) => (a.category === 'Total' ? -1 : b.category === 'Total' ? 1 : a.category_id - b.category_id));
    select('category').innerHTML = categories.map(r => `<option value="${esc(r.category_id)}">${esc(es ? r.category : r.category_en)}</option>`).join('');
    render();
  }
  function render() {
    const series = current();
    const rows = series.observations.filter(r => r.year === Number(select('year').value) && String(r.category_id) === select('category').value && r.geography_type === select('geography').value).sort((a, b) => a.country.localeCompare(b.country, lang));
    const available = rows.filter(r => r.value !== null).length;
    const missing = rows.length - available;
    const total = series.summary;
    select('status').textContent = `${rows.length} ${t('filas para esta selección','rows for this selection')} · ${available} ${t('valores disponibles','available values')} · ${missing} ${t(missing === 1 ? 'ausencia' : 'ausencias', missing === 1 ? 'missing value' : 'missing values')}. ${t('Serie completa','Full series')}: ${total.records.toLocaleString(lang)} ${t('filas','rows')}, ${total.countries_and_territories} ${t('países y territorios','countries and territories')}, ${total.min_year}–${total.max_year}.`;
    select('caption').textContent = series.title[lang] + ' · ' + select('year').value;
    select('rows').innerHTML = rows.length ? rows.map(r => `<tr><th scope="row">${esc(r.country)}${r.iso3 ? ` <small>(${esc(r.iso3)})</small>` : ''}</th><td>${r.year}</td><td>${esc(es ? r.category : r.category_en)}</td><td>${r.value === null ? '—' : r.value.toLocaleString(lang, {maximumFractionDigits: 2})}</td><td>${r.missing_reason ? t('Dato nulo según la fuente (nota 12256).','Null according to source (note 12256).') : r.notes.length ? t('Incluye acceso fijo o móvil.','Includes fixed or mobile access.') : '—'}</td></tr>`).join('') : `<tr><td colspan="5">${t('No hay datos para esta selección; no equivale a cero.','No data for this selection; this does not mean zero.')}</td></tr>`;
    select('method').innerHTML = `<p>${esc(series.note[lang])}</p><p>${t('Procedencia','Origin')}: ${esc(typeof series.origin === 'string' ? series.origin : series.origin[lang])}.</p><p>${t('Consulta','Retrieved')}: ${esc(new Intl.DateTimeFormat(es ? 'es-ES' : 'en-GB', {dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/New_York'}).format(new Date(data.retrieved_at))) + ' (America/New_York)'} · ${t('Actualización de metadatos de la fuente','Source metadata updated')}: ${esc(series.source_updated_at)}.</p><p><a href="${esc(series.source_url)}" target="_blank" rel="noopener noreferrer">${t('Consultar datos y metadatos oficiales','View official data and metadata')} ↗</a></p>`;
  }
  select('series').addEventListener('change', resetSeries);
  ['year', 'category', 'geography'].forEach(name => select(name).addEventListener('change', render));
  resetSeries();
  const entry = document.createElement('div');
  entry.className = 'lac-entry';
  entry.innerHTML = `<div><strong>${t('CEPAL · Conectividad y acceso a la formación','ECLAC · Connectivity and access to learning')}</strong><span>${t('Explora brechas por ingreso, territorio y nivel educativo, con períodos y ausencias visibles.','Explore gaps by income, area and education level, with visible periods and missing values.')}</span></div><a href="?view=education#cepal-context">${t('Consultar las tres series','Explore the three series')} ↗</a>`;
  document.getElementById('editorial-portal').append(entry);
})();
