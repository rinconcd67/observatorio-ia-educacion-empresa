(() => {
  'use strict';
  const es=window.OBSERVATORY_LOCALE!=='en';
  const say=(a,b)=>es?a:b;
  const ds=window.OBSERVATORY_ARTIFACT.snapshot.datasets;
  const p=ds.country_profile,g=ds.global_summary[0];
  const news=window.OBSERVATORY_NEWS,change=window.OBSERVATORY_CHANGES;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const date=v=>Number.isFinite(Date.parse(v))?new Date(/^\d{4}-\d{2}-\d{2}$/.test(v)?v+"T12:00:00Z":v).toLocaleDateString(es?'es-ES':'en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'America/New_York'}):say('Sin fecha','Undated');
  const ratio=n=>new Intl.NumberFormat(es?'es':'en',{maximumFractionDigits:1}).format(n/p.length*100);
  const education=p.filter(r=>Number.isFinite(r.formal_education_ai_pct));
  const eu=education.filter(r=>r.region_source_name==='Europe & Central Asia').length;
  const link=(view,label)=>`<a class="portal-link" href="?view=${view}">${esc(label)} <span aria-hidden="true">↗</span></a>`;
  const newsRows=[...(news.editorial_items??[]),...(news.items??[])].filter(r=>{try{return new URL(r.url).protocol==='https:';}catch{return false;}});
  const headlineRows=newsRows.filter(r=>r.status!=='legacy');
  const featuredSources = new Set();
  const featuredRows = headlineRows.filter(r=>{if(featuredSources.has(r.source))return false;featuredSources.add(r.source);return true;}).slice(0,3);
  const legacyRows=newsRows.filter(r=>r.status==='legacy');
  const card=(n,title,body,view,label)=>`<article class="insight-card"><span class="insight-number">0${n}</span><h3>${esc(title)}</h3><p>${esc(body)}</p>${link(view,label)}</article>`;
  const newsCard=r=>`<article class="news-card"><div class="news-meta"><span>${esc(r.source)}</span><time datetime="${esc(r.published_at)}">${date(r.published_at)}</time></div><h3><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(es?(r.title_es||r.title):(r.title_en||r.title))}</a></h3>${r.library_id?`<p class="news-curated">${r.status==='legacy'?say("Legacy · informe ya incorporado a la biblioteca","Legacy · report already in the library"):say("Selección editorial · informe en biblioteca","Editorial selection · report in library")}</p><a class="news-library-link" href="${es?"biblioteca/":"library/"}${esc(r.library_id)}/">${say("Leer ficha del informe","Read the report record")} →</a>`:""}<span class="news-read">${say('Leer en la fuente','Read at source')} ↗</span></article>`;
  document.getElementById('editorial-portal').innerHTML=`
    <section class="portal-hero"><div class="hero-copy"><p class="eyebrow">${say('CONOCIMIENTO ABIERTO · POSIBILIDADES REALES','OPEN KNOWLEDGE · REAL POSSIBILITIES')}</p><h1>${say('Entiende la IA.<br><em>Imagina lo que sigue.</em>','Understand AI.<br><em>Imagine what’s next.</em>')}</h1><p class="portal-deck">${say('Descubre cómo la inteligencia artificial transforma la educación y el trabajo. Explora datos, encuentra ideas y desarrolla nuevas habilidades.','Discover how artificial intelligence is transforming education and work. Explore data, find ideas and build new skills.')}</p><div class="hero-actions"><a href="#discover" class="portal-button">${say('Encuentra tu próximo paso','Find your next step')} →</a><a href="#data-explorer" class="portal-secondary">${say('Explorar datos','Explore data')}</a></div><p class="hero-footnote">${say('Fuentes oficiales. Mirada global. Conexión latinoamericana.','Official sources. Global perspective. Latin American connections.')}</p></div><figure class="hero-art"><img src="${es?'':'../'}assets/learning-together.webp" alt="${say('Personas conectando aprendizaje, investigación y trabajo alrededor de un computador.','People connecting learning, research and work around a computer.')}" width="1536" height="1024" fetchpriority="high"><figcaption>${say('Aprender. Compartir. Transformar.','Learn. Share. Transform.')}</figcaption></figure></section>
    <section id="discover" class="discovery-section" aria-label="${say('Explora el observatorio','Explore the observatory')}"></section>
    <section class="home-radar editorial-section"><div class="portal-section-title"><div><p class="eyebrow">${say('EN EL RADAR','ON THE RADAR')}</p><h2>${say('Ideas para seguir explorando','Ideas to keep exploring')}</h2></div><a href="#news-window" class="text-link">${say('Ver todos los titulares','See all headlines')} →</a></div><div class="radar-grid">${featuredRows.map(newsCard).join('')}</div><p class="radar-date">${say('Consulta de titulares','Headlines checked')} · ${date(news.checked_at)}</p></section>
    <section id="official-directory" class="editorial-section"></section>
    <section id="learning-guide" class="editorial-section"></section>
    <section id="newsletter" class="editorial-section"></section>
    <details class="reading-notes"><summary>${say('Cómo leer nuestros datos','How to read our data')} · ${g.direct_countries}/${g.countries_catalog} ${say('países con medición directa de uso de IA','countries with direct measurements of AI use')}</summary><div class="insights-grid">
    ${card(1,say('Preparación y uso','Preparedness and use'),say(`AIPI cubre ${g.aipi_countries} países y Oxford ${g.government_readiness_countries}. Sus índices describen preparación estructural.`,`AIPI covers ${g.aipi_countries} countries and Oxford ${g.government_readiness_countries}. Their indices describe structural preparedness.`),'governance',say('Ver preparación','Explore preparedness'))}
    ${card(2,say('País, periodo y población','Country, period and population'),say(`La educación formal tiene medición en ${education.length} países; ${eu} de Europa y Asia Central. Cada fuente identifica su población y periodo.`,`Formal education is measured in ${education.length} countries; ${eu} in Europe and Central Asia. Each source identifies its population and period.`),'education',say('Examinar cobertura','Examine coverage'))}
    ${card(3,say('De la evidencia a la decisión','From evidence to decisions'),say('Consulta la fuente y el contexto de cada indicador. Las tasas de uso describen adopción; los resultados de aprendizaje y productividad requieren otras mediciones.','Check each indicator’s source and context. Usage rates describe adoption; learning outcomes and productivity require other measurements.'),'sources',say('Leer metodología','Read methodology'))}
    </div><div class="change-note"><strong>${say('Cambios desde','Changes since')} ${date(change.baseline)}</strong><span>${say(`${change.added} registros nuevos · ${change.changed} revisados · ${change.removed} retirados.`,`${change.added} new records · ${change.changed} revised · ${change.removed} removed.`)}</span></div></details>
    <section id="news-window" class="editorial-section news-window"><div class="portal-section-title"><div><p class="eyebrow">${say('RADAR DE IA','AI RADAR')}</p><h2>${say('En las fuentes','From the sources')}</h2></div><span class="editorial-label">${say('Comprobado','Checked')} ${date(news.checked_at)}</span></div><p class="news-disclosure">${say('Titulares RSS oficiales en su idioma original y selección editorial con traducción ES/EN. Incluyen anuncios de sus propios productos e investigaciones; no representan una cobertura periodística exhaustiva ni un respaldo del observatorio.','Official RSS headlines in their original language and editorial selections translated into Spanish and English. They include announcements of the publishers’ own products and research; this is not comprehensive news coverage or an endorsement.')}</p><div class="news-grid">${headlineRows.length?headlineRows.slice(0,12).map(newsCard).join(''):`<p>${say('No hay titulares verificados disponibles.','No verified headlines are available.')}</p>`}</div>${legacyRows.length?`<details class="news-legacy news-status"><summary>${say("Legacy · Archivo","Legacy · Archive")} (${legacyRows.length})</summary><p>${say("Noticias anteriores cuyos informes ya están incorporados a la biblioteca del observatorio.","Earlier news whose reports are already included in the Observatory library.")}</p><div class="news-grid">${legacyRows.map(newsCard).join('')}</div></details>`:''}<details class="news-status"><summary>${say('Fuentes y estado de actualización','Sources and refresh status')}</summary><ul>${(news.sources??[]).map(r=>`<li>${esc(r.name)} · ${esc(({ok:say("Operativo","Operational"),stale:say("Copia anterior; consulta fallida","Previous copy; fetch failed"),error:say("No disponible","Unavailable")})[r.status]??r.status)}${r.error?' · '+esc(r.error):''}</li>`).join('')}</ul><p>${say('La ventana se actualiza al ejecutar la consulta de titulares y publicar una nueva versión. No es una transmisión en tiempo real.','This window updates when headlines are fetched and a new version is published. It is not a real-time stream.')}</p></details></section>`;

  const newsPanel=document.getElementById('news-window');
  newsPanel.setAttribute('aria-label',say('Ventana de noticias de IA','AI news window'));
  const panelHeader=document.createElement('div');
  panelHeader.className='news-panel-header';
  panelHeader.innerHTML=`<div><strong>${say('Noticias de IA','AI news')}</strong><small>${say('Fuentes oficiales ·','Official sources ·')} ${date(news.checked_at)}</small></div><button type="button" class="news-minimize" aria-label="${say('Minimizar noticias','Minimize news')}" title="${say('Minimizar noticias','Minimize news')}">−</button>`;
  newsPanel.querySelector('.portal-section-title').remove();
  const panelBody=document.createElement('div');panelBody.className='news-panel-body';
  while(newsPanel.firstChild) panelBody.append(newsPanel.firstChild);
  newsPanel.append(panelHeader,panelBody);document.body.append(newsPanel);
  const launcher=document.createElement('button');launcher.type='button';launcher.className='news-launcher';
  launcher.textContent=say('Noticias de IA ↗','AI news ↗');launcher.setAttribute('aria-controls','news-window');document.body.append(launcher);
  function showNews(open){
    newsPanel.hidden=!open;launcher.hidden=open;
    document.body.classList.toggle('news-panel-open',open);
    launcher.setAttribute('aria-expanded',String(open));
  }
  panelHeader.querySelector('button').addEventListener('click',()=>{showNews(false);launcher.focus();});
  launcher.addEventListener('click',()=>{showNews(true);panelHeader.querySelector('button').focus();});
  newsPanel.addEventListener('keydown',e=>{if(e.key==='Escape'){showNews(false);launcher.focus();}});
  document.querySelector('a[href="#news-window"]').addEventListener('click',e=>{e.preventDefault();showNews(true);panelHeader.querySelector('button').focus();});
  showNews(false);

  const fields={aipi_score:'aipi_year',government_ai_readiness_score:'government_ai_readiness_year',aipi_digital_contribution:'aipi_year',aipi_human_capital_contribution:'aipi_year',aipi_regulation_contribution:'aipi_year',business_ai_pct:'business_year',formal_education_ai_pct:'education_year',internet_users_pct:'internet_year'};
  const period=(rows,field)=>{const ys=[...new Set(rows.map(r=>r[field]).filter(Number.isInteger))].sort();return ys.length?ys.length===1?String(ys[0]):`${ys[0]}–${ys.at(-1)}`:say('sin periodo disponible','period unavailable');};
  const note=(view,content)=>{const target=Array.from(document.querySelectorAll("section.view")).find(v=>v.dataset.view===view)?.querySelector(".metric-strip");if(!target)return;let box=target.nextElementSibling;if(!box?.classList.contains('period-context')){box=document.createElement('p');box.className='period-context';target.after(box);}box.textContent=content;};
  function contexts(){
    const region=document.getElementById('global-region-filter').value;
    const rows=region==='__all__'?p:p.filter(r=>r.region===region);
    const field=document.getElementById('map-metric').value;
    const observed=rows.filter(r=>Number.isFinite(r[field]));
    note('global',say(`Indicador seleccionado: ${observed.length} de ${rows.length} países con dato · Año(s): ${period(observed,fields[field])}. Fecha estadística: ${date(window.OBSERVATORY_ARTIFACT.snapshot.generatedAt)}.`,`Selected indicator: ${observed.length} of ${rows.length} countries with data · Year(s): ${period(observed,fields[field])}. Statistical data date: ${date(window.OBSERVATORY_ARTIFACT.snapshot.generatedAt)}.`));
    note('regions',say('Preparación estructural: AIPI, edición 2023. Los promedios regionales solo incluyen países con observación y no representan adopción de IA.','Structural preparedness: AIPI, 2023 edition. Regional averages include only observed countries and do not represent AI adoption.'));
    const country=p.find(r=>r.iso3===document.getElementById('country-select').value);
    if(country) note('countries',say(`Años del perfil: preparación ${country.aipi_year??'n/d'} · Oxford ${country.government_ai_readiness_year??'n/d'} · empresa ${country.business_year??'n/d'} · educación ${country.education_year??'n/d'}. La revisión del portal no modifica estos periodos.`,`Profile years: preparedness ${country.aipi_year??'n/a'} · Oxford ${country.government_ai_readiness_year??'n/a'} · business ${country.business_year??'n/a'} · education ${country.education_year??'n/a'}. The portal review does not change these periods.`));
    note('education',say(`Cobertura: ${education.length}/${p.length} países. Educación formal: ${period(education,'education_year')}; ${eu} países de Europa y Asia Central. Uso declarado, no resultados de aprendizaje.`,`Coverage: ${education.length}/${p.length} countries. Formal education: ${period(education,'education_year')}; ${eu} countries in Europe and Central Asia. Reported use, not learning outcomes.`));
    const business=p.filter(r=>Number.isFinite(r.business_ai_pct));
    note('business',say(`Cobertura: ${business.length}/${p.length} países · Últimos datos por país: ${period(business,'business_year')}. Empresas de 10 o más personas; los periodos pueden diferir.`,`Coverage: ${business.length}/${p.length} countries · Latest country observations: ${period(business,'business_year')}. Enterprises with 10 or more employees; periods may differ.`));
    note('governance',say('Ediciones: AIPI 2023 · Oxford 2025. Índices de preparación; no tasas de uso de IA.','Editions: AIPI 2023 · Oxford 2025. Preparedness indices, not rates of AI use.'));
  }
  contexts();document.getElementById('global-region-filter').addEventListener('change',contexts);document.getElementById('map-metric').addEventListener('change',contexts);document.getElementById('country-select').addEventListener('change',contexts);
})();
