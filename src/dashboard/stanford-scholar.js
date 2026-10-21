(() => {
  'use strict';

  const es = window.OBSERVATORY_LOCALE !== 'en';
  const lang = es ? 'es' : 'en';
  const say = (a, b) => (es ? a : b);
  const esc = (v) =>
    String(v ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    })[c]);

  const artifact = window.OBSERVATORY_ARTIFACT;
  const datasets = artifact?.snapshot?.datasets ?? {};
  const profiles = datasets.country_profile ?? [];
  const regions = datasets.regional_summary ?? [];
  const profileByIso3 = new Map(profiles.map((r) => [r.iso3, r]));
  const numFmt = new Intl.NumberFormat(es ? 'es-ES' : 'en-US', { maximumFractionDigits: 3 });
  const pctFmt = new Intl.NumberFormat(es ? 'es-ES' : 'en-US', { maximumFractionDigits: 1 });
  const fmt = (v, d = 3) =>
    Number.isFinite(v)
      ? new Intl.NumberFormat(es ? 'es-ES' : 'en-US', { maximumFractionDigits: d, minimumFractionDigits: 0 }).format(v)
      : say('n/d', 'n/a');

  const countryName = (row) => (!es ? row?.country_source_name ?? row?.country : row?.country);
  const regionName = (val, row) => {
    if (es) return val;
    return (
      row?.region_source_name ??
      profiles.find((p) => p.region === val)?.region_source_name ??
      val
    );
  };

  // Official 36-country ranking in Stanford HAI Global AI Vibrancy Tool (https://hai.stanford.edu/ai-index/global-vibrancy-tool)
  const stanfordGvtRankByIso3 = new Map([
    ['USA', 1], ['CHN', 2], ['IND', 3], ['KOR', 4], ['GBR', 5], ['SGP', 6],
    ['ESP', 7], ['ARE', 8], ['JPN', 9], ['CAN', 10], ['CHE', 11], ['LUX', 12],
    ['FRA', 13], ['ISR', 14], ['DEU', 15], ['BRA', 16], ['IRL', 17], ['FIN', 18],
    ['SAU', 19], ['PRT', 20], ['DNK', 21], ['NLD', 22], ['BEL', 23], ['AUS', 24],
    ['SWE', 25], ['MYS', 26], ['ITA', 27], ['RUS', 28], ['AUT', 29], ['NOR', 30],
    ['POL', 31], ['MEX', 32], ['EST', 33], ['TUR', 34], ['NZL', 35], ['ZAF', 36],
  ]);

  const publicSite = 'https://rinconcd67.github.io/observatorio-ia-educacion-empresa/';
  const libPrefix = es ? `${publicSite}biblioteca/` : `${publicSite}en/library/`;

  // ============================================================================
  // 1. TABLA COMPARATIVA DE OBSERVATORIOS INTERNACIONALES + GLOSARIO HCAI (En Global)
  // ============================================================================
  const glossaryTerms = [
    {
      tag: 'Stanford HAI · HCAI',
      title: say('IA Centrada en el Humano (Human-Centered AI)', 'Human-Centered AI (HCAI)'),
      body: say(
        'Enfoque formulado por Stanford HAI según el cual el diseño, evaluación y gobernanza de la IA deben orientarse a colaborar con las personas, ampliar sus capacidades cognitivas y proteger el bienestar comunitario y social, en lugar de sustituir la agencia humana.',
        'Framework established by Stanford HAI holding that AI design, evaluation and governance must collaborate with people, augment human capabilities and safeguard community and societal well-being rather than replace human agency.'
      ),
    },
    {
      tag: say('Tesis Doctoral · SUJIS', 'Doctoral Thesis · SUJIS'),
      title: say('Agencia Autorregulatoria Aumentada (AAA)', 'Augmented Self-Regulatory Agency (AAA)'),
      body: say(
        'Capacidad del estudiante o profesional para planificar, monitorear y evaluar su propio aprendizaje apoyándose en sistemas de IA sin delegar el juicio crítico ni la decisión final. Exige capacidad autorregulatoria previa y responsabilidad epistémica.',
        'A learner’s capacity to plan, monitor and evaluate their own learning with AI support without surrendering critical judgement or final decision-making. It requires prior self-regulatory capacity and epistemic responsibility.'
      ),
    },
    {
      tag: say('Riesgo Pedagógico', 'Pedagogical Risk'),
      title: say('Descarga Cognitiva (Cognitive Offloading)', 'Cognitive Offloading'),
      body: say(
        'Delegación pasiva de operaciones de análisis, síntesis o resolución de problemas en un sistema de IA generativa. Un alto porcentaje de uso de IA no equivale a mayor aprendizaje si encubre descarga cognitiva no supervisada.',
        'Passive delegation of analytical, synthesis or problem-solving operations to a generative AI system. High reported AI use does not equate to deeper learning if it masks unsupervised cognitive offloading.'
      ),
    },
    {
      tag: say('Regla del Observatorio', 'Observatory Rule'),
      title: say('Preparación Estructural vs. Adopción Efectiva', 'Structural Preparedness vs. Actual Adoption'),
      body: say(
        'Distinción epistemológica central del Observatorio: índices como AIPI (FMI) u Oxford miden infraestructura, capital humano y marcos regulatorios (165–194 países), mientras que Eurostat y OCDE miden uso real declarado en empresas y educación (40 países).',
        'Core epistemological distinction of this Observatory: indices such as IMF AIPI or Oxford measure infrastructure, human capital and regulation (165–194 countries), whereas Eurostat and OECD measure reported actual use in firms and education (40 countries).'
      ),
    },
    {
      tag: 'Stanford HAI · GVT',
      title: say('Vibrancia Nacional de IA y Ponderación por Pilares', 'National AI Vibrancy and Pillar Weighting'),
      body: say(
        'Metodología del Global AI Vibrancy Tool de Stanford HAI que evalúa ecosistemas nacionales combinando indicadores en pilares (I+D, Economía, Educación/Talento, Gobernanza, Opinión Pública e Infraestructura) con pesos ajustables según prioridades de política.',
        'Methodology of Stanford HAI’s Global AI Vibrancy Tool evaluating national ecosystems by combining indicators across pillars (R&D, Economy, Talent, Governance, Public Opinion, Infrastructure) with user-adjustable policy weights.'
      ),
    },
    {
      tag: say('Psicometría · CECA-AR', 'Psychometrics · CECA-AR'),
      title: say('Confianza Algorítmica y Ansiedad ante la IA', 'Algorithmic Trust and AI Anxiety'),
      body: say(
        'Dimensiones actitudinales que moderan la adopción: la confianza calibrada exige transparencia y control humano, mientras que la ansiedad operativa o por privacidad explica por qué países o docentes con acceso técnico pueden resistir la adopción.',
        'Attitudinal dimensions moderating adoption: calibrated trust requires transparency and human control, while operational or privacy anxiety explains why countries or teachers with technical access may resist adoption.'
      ),
    },
    {
      tag: say('Gobernanza de Datos', 'Data Governance'),
      title: say('No Imputación y Visibilidad de Ausencias', 'Non-Imputation and Explicit Missingness'),
      body: say(
        'Principio de integridad estadística: un país o escuela sin dato publicado jamás se convierte en cero ni se rellena con promedios regionales. Las brechas empresa-educación solo se calculan cuando ambas series coinciden en el mismo país y año.',
        'Statistical integrity principle: a country or school without published data is never converted to zero or imputed with regional averages. Business-education gaps are computed strictly when both series share the exact same country and year.'
      ),
    },
    {
      tag: 'Google Scholar · FAIR',
      title: say('Trazabilidad Criptográfica (SHA-256) y Principios FAIR', 'Cryptographic Provenance (SHA-256) and FAIR Data'),
      body: say(
        'Cada conector API y archivo público conserva su huella SHA-256 byte-exacta, ventana temporal y metadatos Schema.org/Dataset + Highwire Press para garantizar que sea localizable, accesible, interoperable y reutilizable (FAIR) en investigación doctoral.',
        'Every API connector and public file retains its byte-exact SHA-256 fingerprint, temporal window and Schema.org/Dataset + Highwire Press metadata to ensure Findable, Accessible, Interoperable and Reusable (FAIR) doctoral research.'
      ),
    },
  ];

  const benchmarkSection = document.createElement('section');
  benchmarkSection.className = 'table-band benchmark-band';
  benchmarkSection.id = 'international-benchmark';
  benchmarkSection.innerHTML = `
    <div class="section-heading compact">
      <div>
        <p class="eyebrow">${say('Posicionamiento académico internacional · Benchmarking', 'International academic positioning · Benchmarking')}</p>
        <h2>${say('Comparativa con observatorios universitarios y multilaterales de primer nivel', 'Comparison with leading university and multilateral AI observatories')}</h2>
        <p>${say('Cómo dialoga este Observatorio con Stanford HAI, OECD.AI, CENIA-CEPAL y UNESCO, y qué vacío específico resuelve para la investigación en educación y empresa.', 'How this Observatory dialogues with Stanford HAI, OECD.AI, CENIA-ECLAC and UNESCO, and the specific gap it fills for education and business research.')}</p>
      </div>
      <div class="sector-switcher">
        <a class="action-link" href="${esc(libPrefix + 'stanford-hai-ai-index-2026/')}">${say('Ficha AI Index 2026 →', 'AI Index 2026 record →')}</a>
        <a class="action-link" href="${esc(libPrefix + 'stanford-hai-global-vibrancy-tool-2025/')}">${say('Ficha Vibrancy Tool →', 'Vibrancy Tool record →')}</a>
      </div>
    </div>
    <div class="table-scroll">
      <table class="teacher-table benchmark-table">
        <thead>
          <tr>
            <th>${say('Observatorio / Institución', 'Observatory / Institution')}</th>
            <th>${say('Cobertura geográfica', 'Geographic coverage')}</th>
            <th>${say('Foco en América Latina', 'Latin America coverage')}</th>
            <th>${say('Ejes principales', 'Core dimensions')}</th>
            <th>${say('Aporte diferencial / Relación con este Observatorio', 'Differential contribution / Link to this Observatory')}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row"><a href="https://hai.stanford.edu/ai-index/global-vibrancy-tool" target="_blank" rel="noopener noreferrer">Stanford HAI · AI Index &amp; Global AI Vibrancy Tool ↗</a></th>
            <td>${say('36 países en ranking compuesto · 66 en series longitudinales', '36 countries in composite ranking · 66 in time series')}</td>
            <td>${say('Solo 2 países en el ranking compuesto: Brasil (#16) y México (#32)', 'Only 2 countries in composite ranking: Brazil (#16) and Mexico (#32)')}</td>
            <td>${say('7 pilares: I+D, IA Responsable, Economía, Talento, Política, Opinión Pública e Infraestructura', '7 pillars: R&D, Responsible AI, Economy, Talent, Policy, Public Opinion & Infrastructure')}</td>
            <td>${say('Inspira nuestro simulador de ponderación por pilares, el glosario HCAI y el formato Quick Read / Policy Brief por país.', 'Inspires our interactive pillar weight simulator, HCAI glossary and country Quick Read / Policy Brief generator.')}</td>
          </tr>
          <tr>
            <th scope="row"><a href="https://oecd.ai/" target="_blank" rel="noopener noreferrer">OECD.AI Policy Observatory ↗</a></th>
            <td>${say('Países miembros de la OCDE y economías asociadas (~70)', 'OECD member countries and partner economies (~70)')}</td>
            <td>${say('Parcial (miembros y asociados OCDE: CHL, COL, CRI, MEX, BRA, ARG, PER)', 'Partial (OECD members & partners: CHL, COL, CRI, MEX, BRA, ARG, PER)')}</td>
            <td>${say('Políticas públicas nacionales, uso TIC empresarial/individual y docentes TALIS', 'National public policies, ICT business/individual use and TALIS teachers')}</td>
            <td>${say('Fuente primaria de nuestras series SDMX de adopción empresarial/individual y de las notas docentes TALIS 2024.', 'Primary source for our SDMX business/individual adoption series and TALIS 2024 teacher evidence.')}</td>
          </tr>
          <tr>
            <th scope="row"><a href="https://www.cepal.org/es/publicaciones/82315-indice-latinoamericano-inteligencia-artificial-ilia-2025" target="_blank" rel="noopener noreferrer">CEPAL &amp; CENIA · ILIA 2025 ↗</a></th>
            <td>${say('19 países de América Latina y el Caribe', '19 Latin American and Caribbean countries')}</td>
            <td>${say('Alta en capacidades nacionales (19 países), sin cruce directo con Eurostat/OCDE global', 'High for national capabilities (19 countries), without global Eurostat/OECD crossover')}</td>
            <td>${say('3 dimensiones: Factores habilitantes, I+D y Adopción, Gobernanza', '3 dimensions: Enabling factors, R&D and Adoption, Governance')}</td>
            <td>${say('Integrado en nuestra Biblioteca y complementado con 3.105 registros de conectividad CEPALSTAT en el explorador educativo.', 'Integrated in our Library and complemented by 3,105 CEPALSTAT connectivity records in the education explorer.')}</td>
          </tr>
          <tr>
            <th scope="row"><a href="https://www.unesco.org/en/artificial-intelligence" target="_blank" rel="noopener noreferrer">UNESCO Global AI Observatory &amp; UIS ↗</a></th>
            <td>${say('Global (Estados miembros UNESCO)', 'Global (UNESCO Member States)')}</td>
            <td>${say('33 ministerios en red regional y series de gasto público UIS', '33 ministries in regional network and UIS public spending series')}</td>
            <td>${say('Marcos de competencias (docentes y estudiantes), ética RAM y gasto educativo', 'Competency frameworks (teachers & students), RAM ethics and education spending')}</td>
            <td>${say('Articula nuestras rutas formativas Skills, el marco de 15 competencias docentes y las series de inversión educativa UIS.', 'Anchors our Skills learning routes, the 15-competency teacher framework and UIS education expenditure series.')}</td>
          </tr>
          <tr class="benchmark-highlight-row">
            <th scope="row"><strong>${say('Observatorio Global de IA en Educación y Empresa (BIU)', 'Global AI Observatory for Education and Business (BIU)')}</strong></th>
            <td><strong>${say('218 países y economías en catálogo (194 Oxford · 165 AIPI · 40 uso directo)', '218 countries and economies in catalog (194 Oxford · 165 AIPI · 40 direct use)')}</strong></td>
            <td><strong>${say('Cobertura integral: CEPALSTAT (33 países/territorios), CIMA-PISA (26), UIS (26), TALIS (4) y Cetic.br', 'Comprehensive coverage: CEPALSTAT (33 countries/territories), CIMA-PISA (26), UIS (26), TALIS (4) & Cetic.br')}</strong></td>
            <td><strong>${say('4 pilares: Panorama, Sectores (Educación, Empresa, Gobernanza), Expediente País 360° y Recursos (30 informes + 14 cursos)', '4 pillars: Overview, Sectors (Education, Business, Governance), 360° Country Dossier & Resources (30 reports + 14 courses)')}</strong></td>
            <td><strong>${say('Único observatorio académico bilingüe que cruza preparación macro, adopción real empresa-educación y micro-evidencia docente sin imputar ausencias, con verificación SHA-256 y metadatos Google Scholar / Dataset Search.', 'Only bilingual academic observatory crossing macro readiness, actual business-education adoption and teacher micro-evidence without imputing missing data, with SHA-256 verification and Google Scholar / Dataset Search metadata.')}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="hcai-glossary-wrap" id="hcai-glossary">
      <div class="section-heading compact" style="margin-top:28px">
        <div>
          <p class="eyebrow">${say('Marco conceptual · Inspirado en Stanford HAI AI Glossary', 'Conceptual framework · Inspired by Stanford HAI AI Glossary')}</p>
          <h2>${say('Glosario crítico de IA centrada en el humano y gobernanza educativa', 'Critical glossary of human-centered AI and educational governance')}</h2>
          <p>${say('Definiciones operativas para investigadores, tesistas y tomadores de decisiones.', 'Operational definitions for researchers, doctoral candidates and decision-makers.')}</p>
        </div>
        <label style="min-width:260px">${say('Filtrar concepto', 'Filter concept')}
          <input type="search" id="glossary-search" placeholder="${say('Ej. agencia, descarga cognitiva, vibrancia, FAIR…', 'E.g. agency, cognitive offloading, vibrancy, FAIR…')}">
        </label>
      </div>
      <div class="glossary-grid" id="glossary-grid"></div>
    </div>
  `;

  const ecosystemHub = document.getElementById('ecosystem-hub');
  if (ecosystemHub) {
    ecosystemHub.after(benchmarkSection);
  }

  function renderGlossary(query = '') {
    const q = query.trim().toLowerCase();
    const filtered = glossaryTerms.filter(
      (item) => !q || `${item.tag} ${item.title} ${item.body}`.toLowerCase().includes(q)
    );
    const grid = document.getElementById('glossary-grid');
    if (!grid) return;
    grid.innerHTML = filtered
      .map(
        (item) => `
        <article class="glossary-card">
          <span class="ecosystem-badge">${esc(item.tag)}</span>
          <h3>${esc(item.title)}</h3>
          <p>${esc(item.body)}</p>
        </article>
      `
      )
      .join('');
  }
  renderGlossary();
  document.getElementById('glossary-search')?.addEventListener('input', (e) => renderGlossary(e.target.value));

  // ============================================================================
  // 2. SIMULADOR INTERACTIVO DE PONDERACIÓN POR PILARES (En Gobernanza)
  // ============================================================================
  const govView = Array.from(document.querySelectorAll('section.view')).find((v) => v.dataset.view === 'governance');
  if (govView) {
    const simSection = document.createElement('section');
    simSection.className = 'table-band simulator-band';
    simSection.id = 'gvt-weights-simulator';
    simSection.innerHTML = `
      <div class="section-heading compact">
        <div>
          <p class="eyebrow">${say('Simulador interactivo · Inspirado en Stanford HAI Global AI Vibrancy Tool', 'Interactive simulator · Inspired by Stanford HAI Global AI Vibrancy Tool')}</p>
          <h2>${say('Simulador de ponderación de pilares estructurales (Custom Policy Weights)', 'Structural pillar weighting simulator (Custom Policy Weights)')}</h2>
          <p>${say('Ajusta la importancia relativa de los cuatro pilares del índice AIPI para explorar cómo cambia la posición de las regiones y países según tus prioridades de política universitaria o pública. El índice oficial del FMI permanece intacto.', 'Adjust the relative importance of the four AIPI pillars to explore how regional and country standings shift under your university or public policy priorities. The official IMF index remains unmodified.')}</p>
        </div>
        <div class="sim-presets">
          <button type="button" class="lac-tab active" data-preset="25,25,25,25">${say('Equilibrado FMI (25/25/25/25)', 'IMF Equal (25/25/25/25)')}</button>
          <button type="button" class="lac-tab" data-preset="15,55,15,15">${say('Prioridad Educación y Talento (55 %)', 'Education & Talent Priority (55%)')}</button>
          <button type="button" class="lac-tab" data-preset="15,15,15,55">${say('Prioridad Ética y Regulación (55 %)', 'Ethics & Regulation Priority (55%)')}</button>
          <button type="button" class="lac-tab" data-preset="55,15,15,15">${say('Prioridad Infraestructura (55 %)', 'Infrastructure Priority (55%)')}</button>
        </div>
      </div>
      <div class="sim-controls-grid">
        <label class="sim-slider-card">
          <span>${say('Infraestructura digital', 'Digital infrastructure')} <strong id="w-dig-label">25 %</strong></span>
          <input type="range" id="w-dig" min="0" max="100" value="25">
        </label>
        <label class="sim-slider-card">
          <span>${say('Capital humano y mercado laboral', 'Human capital and labor')} <strong id="w-hum-label">25 %</strong></span>
          <input type="range" id="w-hum" min="0" max="100" value="25">
        </label>
        <label class="sim-slider-card">
          <span>${say('Innovación e integración económica', 'Innovation and integration')} <strong id="w-inn-label">25 %</strong></span>
          <input type="range" id="w-inn" min="0" max="100" value="25">
        </label>
        <label class="sim-slider-card">
          <span>${say('Regulación y ética', 'Regulation and ethics')} <strong id="w-reg-label">25 %</strong></span>
          <input type="range" id="w-reg" min="0" max="100" value="25">
        </label>
        <label class="sim-slider-card">
          <span>${say('Filtrar región en el simulador', 'Filter region in simulator')}</span>
          <select id="sim-region-filter">
            <option value="__all__">${say('Todas las regiones (Top 15)', 'All regions (Top 15)')}</option>
            ${regions.map((r) => `<option value="${esc(r.region)}">${esc(regionName(r.region, r))}</option>`).join('')}
          </select>
        </label>
      </div>
      <div class="table-scroll" style="margin-top:16px">
        <table class="teacher-table">
          <thead>
            <tr>
              <th>#</th>
              <th>${say('País', 'Country')}</th>
              <th>${say('Región', 'Region')}</th>
              <th class="numeric">${say('Puntaje simulado (0-1)', 'Simulated score (0-1)')}</th>
              <th class="numeric">${say('AIPI oficial FMI', 'Official IMF AIPI')}</th>
              <th class="numeric">${say('Cambio de puesto (Δ)', 'Rank shift (Δ)')}</th>
              <th class="numeric">${say('Puesto Stanford GVT (36 países)', 'Stanford GVT Rank (36 countries)')}</th>
            </tr>
          </thead>
          <tbody id="sim-ranking-rows"></tbody>
        </table>
      </div>
      <p class="evidence-limit" style="margin-top:14px">${say('Nota metodológica: Cada contribución original del AIPI (escala 0–0,25) se normaliza a 0–1 multiplicándola por 4 y luego se pondera según los pesos normalizados elegidos por el usuario. Esta simulación es una herramienta exploratoria de sensibilidad y no reemplaza el índice oficial del FMI.', 'Methodological note: Each original AIPI component contribution (0–0.25 scale) is normalized to 0–1 by multiplying by 4 and then weighted by the user’s normalized weights. This simulation is an exploratory sensitivity tool and does not replace the official IMF index.')}</p>
    `;

    const govMetrics = document.getElementById('governance-metrics');
    if (govMetrics) {
      govMetrics.after(simSection);
    }

    const sliders = ['w-dig', 'w-hum', 'w-inn', 'w-reg'].map((id) => document.getElementById(id));
    function updateSimulator() {
      const rawWeights = sliders.map((s) => Number(s.value));
      const sum = rawWeights.reduce((a, b) => a + b, 0) || 1;
      const norm = rawWeights.map((w) => w / sum);

      ['dig', 'hum', 'inn', 'reg'].forEach((k, idx) => {
        const lbl = document.getElementById(`w-${k}-label`);
        if (lbl) lbl.textContent = `${pctFmt.format(norm[idx] * 100)} %`;
      });

      const regionFilter = document.getElementById('sim-region-filter')?.value ?? '__all__';
      const validCountries = profiles.filter(
        (r) =>
          Number.isFinite(r.aipi_score) &&
          Number.isFinite(r.aipi_digital_contribution) &&
          Number.isFinite(r.aipi_human_capital_contribution) &&
          Number.isFinite(r.aipi_innovation_contribution) &&
          Number.isFinite(r.aipi_regulation_contribution) &&
          (regionFilter === '__all__' || r.region === regionFilter)
      );

      const officialSorted = [...validCountries].sort((a, b) => b.aipi_score - a.aipi_score);
      const officialRank = new Map(officialSorted.map((r, i) => [r.iso3, i + 1]));

      const simulated = validCountries
        .map((r) => {
          const simScore =
            norm[0] * (r.aipi_digital_contribution * 4) +
            norm[1] * (r.aipi_human_capital_contribution * 4) +
            norm[2] * (r.aipi_innovation_contribution * 4) +
            norm[3] * (r.aipi_regulation_contribution * 4);
          return { row: r, simScore };
        })
        .sort((a, b) => b.simScore - a.simScore);

      const tbody = document.getElementById('sim-ranking-rows');
      if (!tbody) return;
      tbody.innerHTML = simulated
        .slice(0, 15)
        .map(({ row, simScore }, idx) => {
          const simRank = idx + 1;
          const origRank = officialRank.get(row.iso3) ?? simRank;
          const delta = origRank - simRank;
          const deltaText = delta > 0 ? `+${delta} ↑` : delta < 0 ? `${delta} ↓` : '=';
          const gvtRank = stanfordGvtRankByIso3.get(row.iso3);
          return `
            <tr>
              <td><strong>${simRank}</strong></td>
              <td><strong>${esc(countryName(row))}</strong> <small>(${esc(row.iso3)})</small></td>
              <td>${esc(regionName(row.region, row))}</td>
              <td class="numeric"><strong>${numFmt.format(simScore)}</strong></td>
              <td class="numeric">${numFmt.format(row.aipi_score)} <small>(#${origRank})</small></td>
              <td class="numeric">${esc(deltaText)}</td>
              <td class="numeric">${gvtRank ? `<strong>#${gvtRank} / 36</strong>` : `<small>${say('No incluido en 36 GVT', 'Not in 36 GVT')}</small>`}</td>
            </tr>
          `;
        })
        .join('');
    }

    sliders.forEach((s) =>
      s.addEventListener('input', () => {
        simSection.querySelectorAll('[data-preset]').forEach((b) => b.classList.remove('active'));
        updateSimulator();
      })
    );
    document.getElementById('sim-region-filter')?.addEventListener('change', updateSimulator);
    simSection.querySelectorAll('[data-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        simSection.querySelectorAll('[data-preset]').forEach((b) => b.classList.toggle('active', b === btn));
        const vals = btn.dataset.preset.split(',').map(Number);
        sliders.forEach((s, i) => {
          s.value = String(vals[i]);
        });
        updateSimulator();
      });
    });
    updateSimulator();
  }

  // ============================================================================
  // 3. GENERADOR DE POLICY BRIEF / QUICK READ POR PAÍS + BADGE STANFORD GVT (En Países)
  // ============================================================================
  const countryView = Array.from(document.querySelectorAll('section.view')).find((v) => v.dataset.view === 'countries');
  if (countryView) {
    const intro = countryView.querySelector('.view-intro');
    const selectLabel = intro?.querySelector('label');
    if (intro && selectLabel) {
      const actionsWrap = document.createElement('div');
      actionsWrap.className = 'country-actions-wrap';
      actionsWrap.append(selectLabel);
      const briefBtn = document.createElement('button');
      briefBtn.type = 'button';
      briefBtn.id = 'print-country-brief-btn';
      briefBtn.className = 'action-link primary';
      briefBtn.textContent = say('Generar Policy Brief (Imprimir / PDF)', 'Generate Policy Brief (Print / PDF)');
      actionsWrap.append(briefBtn);
      intro.append(actionsWrap);

      const briefSheet = document.createElement('section');
      briefSheet.className = 'policy-brief-sheet';
      briefSheet.id = 'country-policy-brief-sheet';
      countryView.append(briefSheet);

      function updateCountryBriefAndGvt() {
        const iso = document.getElementById('country-select')?.value || 'COL';
        const row = profileByIso3.get(iso) ?? profiles[0];
        if (!row) return;
        const gvtRank = stanfordGvtRankByIso3.get(row.iso3);
        const gvtNote = gvtRank
          ? say(
              `Clasificado #${gvtRank} de 36 países en el Global AI Vibrancy Tool de Stanford HAI.`,
              `Ranked #${gvtRank} out of 36 countries in Stanford HAI’s Global AI Vibrancy Tool.`
            )
          : say(
              `No incluido entre los 36 países del ranking compuesto GVT de Stanford HAI; monitoreado en este Observatorio con cobertura estructural y regional.`,
              `Not included among the 36 countries in Stanford HAI’s composite GVT ranking; tracked in this Observatory with structural and regional coverage.`
            );

        // Inject Stanford GVT badge into the 360 dossier
        const dossier = document.getElementById('country-360-dossier');
        if (dossier && !dossier.querySelector('.stanford-gvt-item')) {
          const lastCardList = dossier.querySelector('.dossier-card:last-child .dossier-list');
          if (lastCardList) {
            const li = document.createElement('li');
            li.className = 'stanford-gvt-item';
            li.innerHTML = `<strong>Stanford HAI GVT:</strong> ${esc(gvtNote)} <a href="${esc(libPrefix + 'stanford-hai-global-vibrancy-tool-2025/')}">${say('Ver ficha →', 'View record →')}</a>`;
            lastCardList.prepend(li);
          }
        }

        briefSheet.innerHTML = `
          <div class="brief-header">
            <div>
              <p class="eyebrow">${say('POLICY BRIEF / QUICK READ NACIONAL · OBSERVATORIO GLOBAL DE IA (BIU)', 'NATIONAL POLICY BRIEF / QUICK READ · GLOBAL AI OBSERVATORY (BIU)')}</p>
              <h2>${esc(countryName(row))} (${esc(row.iso3)}) — ${esc(regionName(row.region, row))}</h2>
              <p>${say('Autor:', 'Author:')} César David Rincón Godoy (ORCID: 0009-0003-2112-3851) · Broward International University · ${say('Grupo de ingreso:', 'Income group:')} ${esc(row.income_group)}</p>
            </div>
            <button type="button" class="action-link" id="trigger-print-btn">${say('Imprimir / Guardar PDF 🖨️', 'Print / Save PDF 🖨️')}</button>
          </div>
          <div class="brief-summary-grid">
            <div><strong>AIPI (FMI 2023):</strong> ${fmt(row.aipi_score, 3)}</div>
            <div><strong>Oxford Readiness (2025):</strong> ${fmt(row.government_ai_readiness_score, 1)} / 100</div>
            <div><strong>${say('IA en Empresas:', 'Business AI:')}</strong> ${Number.isFinite(row.business_ai_pct) ? `${fmt(row.business_ai_pct, 1)} % (${row.business_year})` : say('Sin observación directa', 'No direct observation')}</div>
            <div><strong>${say('IA en Educación Formal:', 'Formal Education AI:')}</strong> ${Number.isFinite(row.formal_education_ai_pct) ? `${fmt(row.formal_education_ai_pct, 1)} % (${row.education_year})` : say('Sin observación directa', 'No direct observation')}</div>
            <div><strong>${say('Uso de Internet (BM):', 'Internet Use (WB):')}</strong> ${Number.isFinite(row.internet_users_pct) ? `${fmt(row.internet_users_pct, 1)} % (${row.internet_year})` : say('n/d', 'n/a')}</div>
            <div><strong>Stanford HAI GVT:</strong> ${gvtRank ? `#${gvtRank} / 36` : say('Fuera de los 36 países GVT', 'Outside 36 GVT countries')}</div>
          </div>
          <p class="brief-citation"><strong>${say('Cómo citar esta ficha nacional (APA 7):', 'How to cite this country brief (APA 7):')}</strong> Rincón Godoy, C. D. (2026). <em>${say('Expediente nacional 360° de preparación y adopción de IA:', '360° country dossier on AI preparedness and adoption:')} ${esc(countryName(row))} (${esc(row.iso3)})</em>. Observatorio Global de Inteligencia Artificial en Educación y Empresa (v0.5.0). Broward International University. ${esc(publicSite)}?view=countries&amp;country=${esc(row.iso3)}</p>
        `;
        briefSheet.querySelector('#trigger-print-btn')?.addEventListener('click', () => window.print());
      }

      briefBtn.addEventListener('click', () => {
        updateCountryBriefAndGvt();
        briefSheet.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => window.print(), 250);
      });
      document.getElementById('country-select')?.addEventListener('change', () => setTimeout(updateCountryBriefAndGvt, 20));
      setTimeout(updateCountryBriefAndGvt, 30);
    }
  }

  // ============================================================================
  // 4. RETO GOOGLE SCHOLAR & GOOGLE DATASET SEARCH: HUB DE CITACIÓN CIENTÍFICA
  // ============================================================================
  const citationBand = document.querySelector('.citation-band');
  if (citationBand) {
    const bibtex = `@misc{rincongodoy2026observatorio,
  author       = {Rinc{\\'o}n Godoy, C{\\'e}sar David},
  title        = {Observatorio Global de Inteligencia Artificial en Educaci{\\'o}n y Empresa (v0.5.0)},
  year         = {2026},
  publisher    = {Broward International University},
  howpublished = {\\url{https://rinconcd67.github.io/observatorio-ia-educacion-empresa/}},
  note         = {ORCID: 0009-0003-2112-3851. Dataset reproducible con 5.280 observaciones globales y 3.105 registros CEPALSTAT verificados por SHA-256}
}`;
    const ris = `TY  - DATA
T1  - Observatorio Global de Inteligencia Artificial en Educación y Empresa (v0.5.0)
AU  - Rincón Godoy, César David
PY  - 2026
PB  - Broward International University
UR  - https://rinconcd67.github.io/observatorio-ia-educacion-empresa/
N1  - ORCID: 0009-0003-2112-3851; SHA-256 verified open dataset
ER  - `;

    const scholarPanel = document.createElement('section');
    scholarPanel.className = 'table-band scholar-indexing-band';
    scholarPanel.id = 'scholar-indexing-hub';
    scholarPanel.innerHTML = `
      <div class="section-heading compact">
        <div>
          <p class="eyebrow">Google Scholar · Google Dataset Search · FAIR Research</p>
          <h2>${say('Indexación académica y exportación de citas para investigación', 'Academic indexing and citation export for research')}</h2>
          <p>${say('Este observatorio implementa metadatos Highwire Press (citation_*), Dublin Core y Schema.org/Dataset + DataDownload para su indexación en Google Scholar y Google Dataset Search.', 'This observatory implements Highwire Press (citation_*), Dublin Core and Schema.org/Dataset + DataDownload metadata for indexing in Google Scholar and Google Dataset Search.')}</p>
        </div>
        <div class="download-actions">
          <a class="action-link primary" href="${es ? '' : '../'}data/citation.bib" download="observatorio-ia-rincon-2026.bib">${say('Descargar BibTeX (.bib)', 'Download BibTeX (.bib)')}</a>
          <a class="action-link" href="${es ? '' : '../'}data/citation.ris" download="observatorio-ia-rincon-2026.ris">${say('Descargar RIS (Zotero / Mendeley)', 'Download RIS (Zotero / Mendeley)')}</a>
          <button type="button" class="action-link" id="copy-bibtex-btn">${say('Copiar BibTeX', 'Copy BibTeX')}</button>
        </div>
      </div>
      <div class="scholar-code-grid">
        <div>
          <h3>BibTeX (LaTeX / Overleaf / Google Scholar)</h3>
          <pre class="scholar-pre"><code>${esc(bibtex)}</code></pre>
        </div>
        <div>
          <h3>RIS (Zotero / Mendeley / EndNote)</h3>
          <pre class="scholar-pre"><code>${esc(ris)}</code></pre>
        </div>
      </div>
    `;
    citationBand.after(scholarPanel);
    document.getElementById('copy-bibtex-btn')?.addEventListener('click', (e) => {
      navigator.clipboard?.writeText(bibtex);
      e.currentTarget.textContent = say('¡BibTeX copiado!', 'BibTeX copied!');
    });
  }
})();
