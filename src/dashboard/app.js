(() => {
  "use strict";

  const artifact = window.OBSERVATORY_ARTIFACT;
  const geojson = window.OBSERVATORY_GEOJSON;
  const datasets = artifact.snapshot.datasets;
  const profiles = datasets.country_profile;
  const regions = datasets.regional_summary;
  const global = datasets.global_summary[0];
  const profileByIso3 = new Map(profiles.map((row) => [row.iso3, row]));
  const regionByName = new Map(regions.map((row) => [row.region, row]));
  const tooltip = document.getElementById("tooltip");

  const palette = {
    teal: "#007c78",
    coral: "#dc5a46",
    blue: "#2f5da8",
    gold: "#c88a18",
    green: "#4f865c",
    berry: "#a23e65",
    neutral: "#87938f",
  };
  const regionColors = new Map([
    ["América del Norte", "#2f5da8"],
    ["Europa y Asia Central", "#007c78"],
    ["Asia Oriental y Pacífico", "#4f865c"],
    ["Oriente Medio, Norte de África, Afganistán y Pakistán", "#c88a18"],
    ["América Latina y el Caribe", "#dc5a46"],
    ["Asia Meridional", "#a23e65"],
    ["África subsahariana", "#6e7650"],
  ]);
  const componentDefinitions = [
    ["aipi_digital_contribution", "Infraestructura digital", palette.blue],
    ["aipi_innovation_contribution", "Innovación e integración", palette.gold],
    ["aipi_human_capital_contribution", "Capital humano y trabajo", palette.green],
    ["aipi_regulation_contribution", "Regulación y ética", palette.berry],
  ];
  const regionalComponentFields = new Map([
    ["aipi_digital_contribution", "digital_average"],
    ["aipi_innovation_contribution", "innovation_average"],
    ["aipi_human_capital_contribution", "human_capital_average"],
    ["aipi_regulation_contribution", "regulation_average"],
  ]);
  const mapMetrics = {
    aipi_score: { label: "Preparación AIPI", unit: "0-1", digits: 3, max: 1, colors: ["#d9efeb", "#94d4c7", "#42aa9d", "#007c78", "#005c59"], cuts: [0.3, 0.42, 0.54, 0.66] },
    government_ai_readiness_score: { label: "Preparación gubernamental", unit: "0-100", digits: 1, max: 100, colors: ["#f6e9ca", "#ecd296", "#dcb556", "#c88a18", "#8a5d0b"], cuts: [30, 42, 54, 66] },
    aipi_digital_contribution: { label: "Infraestructura digital", unit: "0-0,25", max: 0.25, colors: ["#e2e9f6", "#b8c9e8", "#7fa0d1", "#2f5da8", "#1f4178"], cuts: [0.06, 0.1, 0.14, 0.18] },
    aipi_human_capital_contribution: { label: "Capital humano", unit: "0-0,25", max: 0.25, colors: ["#e0eee3", "#b8d8bf", "#83b68e", "#4f865c", "#345f40"], cuts: [0.06, 0.1, 0.14, 0.18] },
    aipi_regulation_contribution: { label: "Regulación y ética", unit: "0-0,25", max: 0.25, colors: ["#f3dfe7", "#dfb2c4", "#c77b99", "#a23e65", "#732646"], cuts: [0.06, 0.1, 0.14, 0.18] },
    business_ai_pct: { label: "Adopción empresarial", unit: "%", max: 50, colors: ["#e2e9f6", "#b8c9e8", "#7fa0d1", "#2f5da8", "#1f4178"], cuts: [8, 15, 22, 30] },
    formal_education_ai_pct: { label: "IA para educación formal", unit: "%", max: 30, colors: ["#fae4df", "#f2bfb5", "#e99180", "#dc5a46", "#a93d2c"], cuts: [5, 10, 15, 20] },
    internet_users_pct: { label: "Uso de Internet", unit: "%", max: 100, colors: ["#f6e9ca", "#ecd296", "#dcb556", "#c88a18", "#8a5d0b"], cuts: [40, 60, 75, 90] },
  };

  const state = {
    view: "global",
    region: "Todas las regiones",
    mapMetric: "aipi_score",
    country: profiles.some((row) => row.iso3 === "COL") ? "COL" : profiles.find((row) => Number.isFinite(row.aipi_score))?.iso3,
  };

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  }

  function number(value, digits = 2) {
    if (!Number.isFinite(value)) return "n/d";
    return new Intl.NumberFormat("es-ES", { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(value);
  }

  function integer(value) {
    if (!Number.isFinite(value)) return "n/d";
    return new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 }).format(value);
  }

  function percentage(value, digits = 1) {
    return Number.isFinite(value) ? `${number(value, digits)} %` : "n/d";
  }

  function metricCard(label, value, context, color) {
    return `<article class="metric" style="--metric-color:${color}"><span class="label">${escapeHtml(label)}</span><div class="value">${escapeHtml(value)}</div><span class="context">${escapeHtml(context)}</span></article>`;
  }

  function setMetricStrip(id, cards) {
    document.getElementById(id).innerHTML = cards.join("");
  }

  function mean(values) {
    const valid = values.filter(Number.isFinite);
    return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
  }

  function populateSelect(select, options, selected) {
    select.innerHTML = options.map(([value, label]) => `<option value="${escapeHtml(value)}"${value === selected ? " selected" : ""}>${escapeHtml(label)}</option>`).join("");
  }

  function showTooltip(event, html) {
    tooltip.innerHTML = html;
    tooltip.style.left = `${Math.min(event.clientX + 12, window.innerWidth - 280)}px`;
    tooltip.style.top = `${Math.min(event.clientY + 12, window.innerHeight - 120)}px`;
    tooltip.classList.add("visible");
  }

  function hideTooltip() {
    tooltip.classList.remove("visible");
  }

  function colorForMetric(metricId, value) {
    if (!Number.isFinite(value)) return "#dfe5e2";
    const metric = mapMetrics[metricId];
    const index = metric.cuts.findIndex((cut) => value < cut);
    return metric.colors[index === -1 ? metric.colors.length - 1 : index];
  }

  function ringPath(ring) {
    let path = "";
    let started = false;
    let previousLongitude = null;
    for (const coordinate of ring) {
      const longitude = Number(coordinate[0]);
      const latitude = Number(coordinate[1]);
      if (previousLongitude !== null && Math.abs(longitude - previousLongitude) > 180) started = false;
      const x = ((longitude + 180) / 360) * 1000;
      const y = ((90 - latitude) / 180) * 500;
      path += `${started ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)} `;
      started = true;
      previousLongitude = longitude;
    }
    return `${path}Z `;
  }

  function geometryPath(geometry) {
    if (!geometry) return "";
    if (geometry.type === "Polygon") return geometry.coordinates.map(ringPath).join("");
    if (geometry.type === "MultiPolygon") return geometry.coordinates.flatMap((polygon) => polygon.map(ringPath)).join("");
    return "";
  }

  function renderMap() {
    const svg = document.getElementById("world-map");
    const metric = mapMetrics[state.mapMetric];
    const regionRows = state.region === "Todas las regiones" ? profiles : profiles.filter((row) => row.region === state.region);
    const regionSet = new Set(regionRows.map((row) => row.iso3));
    svg.innerHTML = geojson.features.map((feature) => {
      const row = profileByIso3.get(feature.id);
      const value = row?.[state.mapMetric];
      const dimmed = state.region !== "Todas las regiones" && !regionSet.has(feature.id);
      const country = row?.country ?? feature.properties?.name ?? feature.id;
      return `<path class="map-country" tabindex="0" data-iso3="${escapeHtml(feature.id)}" data-country="${escapeHtml(country)}" data-value="${Number.isFinite(value) ? value : ""}" d="${geometryPath(feature.geometry)}" fill="${colorForMetric(state.mapMetric, value)}" opacity="${dimmed ? 0.16 : 1}"></path>`;
    }).join("");

    svg.querySelectorAll(".map-country").forEach((path) => {
      const iso3 = path.dataset.iso3;
      const row = profileByIso3.get(iso3);
      const value = row?.[state.mapMetric];
      const content = `<strong>${escapeHtml(path.dataset.country)}</strong><br>${escapeHtml(row?.region ?? "Sin clasificación")}<br>${escapeHtml(metric.label)}: <b>${Number.isFinite(value) ? number(value, metric.digits ?? (state.mapMetric.includes("pct") ? 1 : 3)) : "sin dato"}</b>`;
      path.addEventListener("pointermove", (event) => showTooltip(event, content));
      path.addEventListener("pointerleave", hideTooltip);
      path.addEventListener("focus", (event) => showTooltip({ clientX: 24, clientY: 150 }, content));
      path.addEventListener("blur", hideTooltip);
      path.addEventListener("click", () => {
        if (!row) return;
        state.country = iso3;
        document.getElementById("country-select").value = iso3;
        setView("countries");
      });
    });

    document.getElementById("map-subtitle").textContent = `${metric.label}; ${metric.unit}. Los países sin observación permanecen en gris.`;
    const labels = ["Bajo", "", "Medio", "", "Alto"];
    document.getElementById("map-legend").innerHTML = metric.colors.map((color, index) => `<span class="legend-swatch" style="background:${color}" title="${labels[index] || "Escala intermedia"}"></span>`).join("") + `<span>${metric.unit}</span>`;

    const values = regionRows.map((row) => row[state.mapMetric]).filter(Number.isFinite);
    const areaName = state.region === "Todas las regiones" ? "Mundo" : state.region;
    const total = regionRows.length;
    const average = mean(values);
    const source = state.mapMetric.startsWith("aipi") ? "FMI" : state.mapMetric.startsWith("government_") ? "Oxford Insights" : state.mapMetric === "internet_users_pct" ? "Banco Mundial" : "Eurostat / OCDE";
    document.getElementById("map-summary").innerHTML = `<div><p class="eyebrow">${escapeHtml(metric.label)}</p><h3>${escapeHtml(areaName)}</h3><p>${values.length} países con observación de ${total} en el catálogo.</p></div><dl><div class="summary-row"><dt>Promedio</dt><dd>${number(average, metric.digits ?? (state.mapMetric.includes("pct") ? 1 : 3))}</dd></div><div class="summary-row"><dt>Cobertura</dt><dd>${total ? percentage((values.length / total) * 100, 1) : "n/d"}</dd></div><div class="summary-row"><dt>Máximo observado</dt><dd>${number(values.length ? Math.max(...values) : null, metric.digits ?? (state.mapMetric.includes("pct") ? 1 : 3))}</dd></div><div class="summary-row"><dt>Fuente principal</dt><dd>${source}</dd></div></dl>`;
  }

  function renderBarList(id, rows, options) {
    const container = document.getElementById(id);
    const validRows = rows.filter((row) => Number.isFinite(row[options.field])).slice(0, options.limit ?? rows.length);
    if (!validRows.length) {
      container.innerHTML = `<div class="empty-state">No hay observaciones directas para esta selección.</div>`;
      return;
    }
    const maximum = options.max ?? Math.max(...validRows.map((row) => row[options.field]));
    container.innerHTML = `<div class="bar-list">${validRows.map((row) => {
      const width = Math.max(1, (row[options.field] / maximum) * 100);
      const note = options.note ? options.note(row) : "";
      return `<div class="bar-row"><span class="bar-label" title="${escapeHtml(row[options.labelField])}">${escapeHtml(row[options.labelField])}${note ? `<small class="bar-note">${escapeHtml(note)}</small>` : ""}</span><span class="bar-track"><span class="bar-fill" style="width:${width}%;--bar-color:${options.color ?? palette.teal}"></span></span><span class="bar-value">${number(row[options.field], options.digits ?? 2)}${options.suffix ?? ""}</span></div>`;
    }).join("")}</div>`;
  }

  function distributionBins(values) {
    const bins = Array.from({ length: 8 }, (_, index) => ({ start: index / 10, end: (index + 1) / 10, count: 0 }));
    values.filter(Number.isFinite).forEach((value) => {
      const index = Math.min(7, Math.max(0, Math.floor(value * 10)));
      bins[index].count += 1;
    });
    return bins;
  }

  function renderHistogram(id, values) {
    const bins = distributionBins(values);
    const max = Math.max(...bins.map((bin) => bin.count), 1);
    document.getElementById(id).innerHTML = `<div class="histogram">${bins.map((bin) => `<div class="hist-bin"><div class="hist-column" style="height:${(bin.count / max) * 100}%"><strong>${bin.count}</strong></div><span>${number(bin.start, 1)}-${number(bin.end, 1)}</span></div>`).join("")}</div>`;
  }

  function componentLegend() {
    return `<div class="component-legend">${componentDefinitions.map(([, label, color]) => `<span><i style="background:${color}"></i>${escapeHtml(label)}</span>`).join("")}</div>`;
  }

  function regionLegend() {
    return `<div class="component-legend">${regions.map((row) => `<span><i style="background:${regionColors.get(row.region) ?? palette.neutral}"></i>${escapeHtml(row.region)}</span>`).join("")}</div>`;
  }

  function renderComponentBars(id, row) {
    if (!row) return;
    document.getElementById(id).innerHTML = `<div class="bar-list">${componentDefinitions.map(([field, label, color]) => `<div class="bar-row"><span class="bar-label">${escapeHtml(label)}</span><span class="bar-track"><span class="bar-fill" style="width:${Math.max(0, (row[field] ?? 0) / 0.25 * 100)}%;--bar-color:${color}"></span></span><span class="bar-value">${number(row[field], 3)}</span></div>`).join("")}</div>${componentLegend()}`;
  }

  function renderRegionalStacks(id) {
    document.getElementById(id).innerHTML = `<div class="component-stack">${regions.map((row) => `<div class="stack-row"><div class="stack-head"><strong>${escapeHtml(row.region)}</strong><strong>${number(row.aipi_average, 3)}</strong></div><div class="stack-track">${componentDefinitions.map(([field, , color]) => `<span class="stack-segment" style="width:${(row[regionalComponentFields.get(field)] ?? 0) * 100}%;background:${color}"></span>`).join("")}</div></div>`).join("")}</div>${componentLegend()}`;
  }

  function renderGlobal() {
    setMetricStrip("global-metrics", [
      metricCard("Países y economías", integer(global.countries_catalog), "Catálogo maestro", palette.blue),
      metricCard("Oxford 2025", integer(global.government_readiness_countries), `${number(global.government_readiness_coverage_pct, 1)} % del catálogo`, palette.gold),
      metricCard("Cobertura AIPI", integer(global.aipi_countries), `${number(global.aipi_coverage_pct, 1)} % del catálogo`, palette.teal),
      metricCard("Regiones", integer(global.regions), "Comparación territorial", palette.coral),
      metricCard("Uso o adopción directa", integer(global.direct_countries), `${number(global.direct_coverage_pct, 1)} % del catálogo`, palette.berry),
    ]);
    renderMap();
    renderBarList("global-region-bars", regions, { field: "aipi_average", labelField: "region", max: 0.8, digits: 3, color: palette.teal, note: (row) => `${row.aipi_countries} países` });
    renderHistogram("global-distribution", profiles.map((row) => row.aipi_score));
    renderCoverageTable();
  }

  function renderCoverageTable() {
    document.getElementById("coverage-table").innerHTML = `<thead><tr><th>Región</th><th class="numeric">Catálogo</th><th class="numeric">AIPI</th><th class="numeric">Empresa</th><th class="numeric">Educación formal</th><th class="numeric">Estudiantes</th><th class="numeric">Uso individual</th></tr></thead><tbody>${regions.map((row) => `<tr><td><strong>${escapeHtml(row.region)}</strong></td><td class="numeric">${integer(row.countries_catalog)}</td><td class="numeric">${integer(row.aipi_countries)}</td><td class="numeric">${integer(row.business_countries)}</td><td class="numeric">${integer(row.education_countries)}</td><td class="numeric">${integer(row.student_countries)}</td><td class="numeric">${integer(row.individual_countries)}</td></tr>`).join("")}</tbody>`;
  }

  function renderRegions() {
    const selected = regionByName.get(document.getElementById("region-select").value) ?? regions[0];
    setMetricStrip("region-metrics", [
      metricCard("Países", integer(selected.countries_catalog), "Catálogo regional", palette.blue),
      metricCard("AIPI medio", number(selected.aipi_average, 3), `${selected.aipi_countries} países`, palette.teal),
      metricCard("Oxford medio", number(selected.government_readiness_average, 1), `${selected.government_readiness_countries} países`, palette.gold),
      metricCard("Uso directo", integer(selected.direct_countries), `${percentage((selected.direct_countries / selected.countries_catalog) * 100, 1)} de cobertura`, palette.coral),
      metricCard("Internet medio", percentage(selected.internet_average_pct, 1), `${selected.internet_countries} países`, palette.gold),
      metricCard("Empresa", percentage(selected.business_average_pct, 1), `${selected.business_countries} países`, palette.berry),
    ]);
    renderComponentBars("region-components", {
      aipi_digital_contribution: selected.digital_average,
      aipi_innovation_contribution: selected.innovation_average,
      aipi_human_capital_contribution: selected.human_capital_average,
      aipi_regulation_contribution: selected.regulation_average,
    });
    const rows = profiles.filter((row) => row.region === selected.region && Number.isFinite(row.aipi_score)).sort((a, b) => b.aipi_score - a.aipi_score);
    renderBarList("region-country-bars", rows, { field: "aipi_score", labelField: "country", max: 0.85, digits: 3, color: regionColors.get(selected.region), limit: 12 });
    document.getElementById("regions-table").innerHTML = `<thead><tr><th>Región</th><th class="numeric">Oxford</th><th class="numeric">AIPI</th><th class="numeric">Infraestructura</th><th class="numeric">Innovación</th><th class="numeric">Capital humano</th><th class="numeric">Regulación</th><th class="numeric">Internet</th></tr></thead><tbody>${regions.map((row) => `<tr><td><strong>${escapeHtml(row.region)}</strong></td><td class="numeric">${number(row.government_readiness_average, 1)}</td><td class="numeric">${number(row.aipi_average, 3)}</td><td class="numeric">${number(row.digital_average, 3)}</td><td class="numeric">${number(row.innovation_average, 3)}</td><td class="numeric">${number(row.human_capital_average, 3)}</td><td class="numeric">${number(row.regulation_average, 3)}</td><td class="numeric">${percentage(row.internet_average_pct, 1)}</td></tr>`).join("")}</tbody>`;
  }

  function renderCountries() {
    const row = profileByIso3.get(state.country) ?? profiles[0];
    const region = regionByName.get(row.region);
    document.getElementById("country-view-title").textContent = row.country;
    document.getElementById("country-view-subtitle").textContent = `${row.region} · ${row.income_group}`;
    setMetricStrip("country-metrics", [
      metricCard("Oxford Gobierno", number(row.government_ai_readiness_score, 1), row.government_ai_readiness_year ? `Edición ${row.government_ai_readiness_year}` : "Sin observación", palette.gold),
      metricCard("Preparación AIPI", number(row.aipi_score, 3), row.aipi_year ? `Edición ${row.aipi_year}` : "Sin observación", palette.teal),
      metricCard("IA en empresas", percentage(row.business_ai_pct, 1), row.business_year ? `Año ${row.business_year}` : "Sin observación", palette.blue),
      metricCard("IA para educación", percentage(row.formal_education_ai_pct, 1), row.education_year ? `Año ${row.education_year}` : "Sin observación", palette.coral),
      metricCard("Uso individual GenAI", percentage(row.individual_genai_pct, 1), row.individual_genai_year ? `Año ${row.individual_genai_year}` : "Sin observación", palette.berry),
    ]);
    renderComponentBars("country-components", row);
    renderBarList("country-comparison", [
      { label: row.country, value: row.aipi_score },
      { label: row.region, value: region?.aipi_average },
      { label: "Promedio mundial", value: global.aipi_average },
    ], { field: "value", labelField: "label", max: 0.85, digits: 3, color: palette.teal });
    const details = [
      ["Uso de Internet", percentage(row.internet_users_pct, 1), row.internet_year],
      ["Matrícula terciaria", percentage(row.tertiary_enrollment_pct, 1), row.tertiary_year],
      ["PIB per cápita", Number.isFinite(row.gdp_per_capita_usd) ? `USD ${integer(row.gdp_per_capita_usd)}` : "n/d", row.gdp_year],
      ["IA entre estudiantes", percentage(row.student_ai_pct, 1), row.student_year],
      ["Brecha empresa-educación", Number.isFinite(row.adoption_gap_pp) ? `${number(row.adoption_gap_pp, 2)} pp` : "n/d", null],
      ["Oxford · capacidad de política", number(row.government_policy_capacity, 1), row.government_ai_readiness_year],
      ["Oxford · infraestructura de IA", number(row.government_ai_infrastructure, 1), row.government_ai_readiness_year],
      ["Oxford · gobernanza", number(row.government_ai_governance, 1), row.government_ai_readiness_year],
      ["Oxford · adopción sector público", number(row.government_public_sector_adoption, 1), row.government_ai_readiness_year],
      ["Oxford · desarrollo y difusión", number(row.government_development_diffusion, 1), row.government_ai_readiness_year],
      ["Oxford · resiliencia", number(row.government_ai_resilience, 1), row.government_ai_readiness_year],
      ["Grupo de ingreso", row.income_group, null],
      ["Región", row.region, null],
      ["Código ISO", row.iso3, null],
    ];
    document.getElementById("country-detail-grid").innerHTML = details.map(([label, value, year]) => `<div class="detail-item"><span class="label">${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>${year ? `<small>Año ${year}</small>` : ""}</div>`).join("");
  }

  function renderEducation() {
    const formal = datasets.education_top;
    const individual = datasets.individual_top;
    const students = profiles.filter((row) => Number.isFinite(row.student_ai_pct));
    setMetricStrip("education-metrics", [
      metricCard("Educación formal", integer(formal.length), "Países con dato", palette.coral),
      metricCard("Promedio educación formal", percentage(mean(formal.map((row) => row.formal_education_ai_pct)), 1), "Promedio no ponderado", palette.coral),
      metricCard("Estudiantes", integer(students.length), "Países con dato", palette.gold),
      metricCard("Uso individual GenAI", integer(individual.length), "Países con dato", palette.berry),
      metricCard("Región dominante", "Europa", "Cobertura directa", palette.blue),
    ]);
    renderBarList("education-bars", formal, { field: "formal_education_ai_pct", labelField: "country", max: 25, digits: 1, suffix: "%", color: palette.coral, limit: 12 });
    renderBarList("individual-bars", individual, { field: "individual_genai_pct", labelField: "country", max: 60, digits: 1, suffix: "%", color: palette.berry, limit: 12 });
  }

  function renderPeriods() {
    const rows = datasets.business_trend;
    const max = Math.max(...rows.map((row) => row.adoption_pct), 1);
    document.getElementById("business-periods").innerHTML = `<div class="period-chart">${rows.map((row) => `<div class="period-item"><div class="period-bar" style="height:${(row.adoption_pct / max) * 100}%"><strong>${number(row.adoption_pct, 1)}%</strong></div><span class="period-label">${row.year}<br>${row.countries} países</span></div>`).join("")}</div>`;
  }

  function renderScatter() {
    const rows = datasets.readiness_adoption;
    const width = 760;
    const height = 400;
    const margin = { left: 56, right: 20, top: 18, bottom: 48 };
    const x = (value) => margin.left + ((value - 0.15) / 0.7) * (width - margin.left - margin.right);
    const y = (value) => height - margin.bottom - (value / 50) * (height - margin.top - margin.bottom);
    const xTicks = [0.2, 0.4, 0.6, 0.8];
    const yTicks = [0, 10, 20, 30, 40, 50];
    const svg = `<div class="scatter-wrap"><svg class="scatter" viewBox="0 0 ${width} ${height}" role="img" aria-label="Preparación AIPI frente a adopción empresarial">${xTicks.map((tick) => `<line class="grid" x1="${x(tick)}" x2="${x(tick)}" y1="${margin.top}" y2="${height - margin.bottom}"></line><text x="${x(tick)}" y="${height - 22}" text-anchor="middle">${number(tick, 1)}</text>`).join("")}${yTicks.map((tick) => `<line class="grid" x1="${margin.left}" x2="${width - margin.right}" y1="${y(tick)}" y2="${y(tick)}"></line><text x="${margin.left - 10}" y="${y(tick) + 4}" text-anchor="end">${tick}</text>`).join("")}<line class="axis" x1="${margin.left}" x2="${width - margin.right}" y1="${height - margin.bottom}" y2="${height - margin.bottom}"></line><line class="axis" x1="${margin.left}" x2="${margin.left}" y1="${margin.top}" y2="${height - margin.bottom}"></line><text x="${width / 2}" y="${height - 3}" text-anchor="middle">Índice AIPI (0-1)</text><text transform="translate(14 ${height / 2}) rotate(-90)" text-anchor="middle">Empresas que usan IA (%)</text>${rows.map((row) => `<circle tabindex="0" data-country="${escapeHtml(row.country)}" data-region="${escapeHtml(row.region)}" data-aipi="${row.aipi_score}" data-business="${row.business_ai_pct}" cx="${x(row.aipi_score)}" cy="${y(row.business_ai_pct)}" r="6" fill="${regionColors.get(row.region) ?? palette.neutral}"></circle>`).join("")}</svg></div>${regionLegend()}`;
    document.getElementById("business-scatter").innerHTML = svg;
    document.querySelectorAll("#business-scatter circle").forEach((circle) => {
      const content = `<strong>${escapeHtml(circle.dataset.country)}</strong><br>${escapeHtml(circle.dataset.region)}<br>AIPI: <b>${number(Number(circle.dataset.aipi), 3)}</b><br>Empresas: <b>${percentage(Number(circle.dataset.business), 1)}</b>`;
      circle.addEventListener("pointermove", (event) => showTooltip(event, content));
      circle.addEventListener("pointerleave", hideTooltip);
    });
  }

  function renderBusiness() {
    const rows = datasets.business_top;
    setMetricStrip("business-metrics", [
      metricCard("Países observados", integer(rows.length), "Último dato disponible", palette.blue),
      metricCard("Promedio", percentage(mean(rows.map((row) => row.business_ai_pct)), 1), "Promedio no ponderado", palette.blue),
      metricCard("Regiones cubiertas", integer(new Set(rows.map((row) => row.region)).size), "Cobertura directa", palette.gold),
      metricCard("Cruce con AIPI", integer(datasets.readiness_adoption.length), "Países comparables", palette.teal),
      metricCard("Fuente prevalente", "Eurostat", "OCDE amplía cobertura", palette.coral),
    ]);
    renderPeriods();
    renderBarList("business-bars", rows, { field: "business_ai_pct", labelField: "country", max: 50, digits: 1, suffix: "%", color: palette.blue, limit: 12 });
    renderScatter();
  }

  function renderGovernanceTable(query = "") {
    const normalized = query.trim().toLocaleLowerCase("es");
    const rows = profiles.filter((row) => (Number.isFinite(row.aipi_score) || Number.isFinite(row.government_ai_readiness_score)) && (!normalized || `${row.country} ${row.region}`.toLocaleLowerCase("es").includes(normalized)));
    document.getElementById("governance-table").innerHTML = `<thead><tr><th>País</th><th>Región</th><th class="numeric">Oxford</th><th class="numeric">AIPI</th><th class="numeric">Política</th><th class="numeric">Gobernanza</th><th class="numeric">Sector público</th><th class="numeric">Resiliencia</th></tr></thead><tbody>${rows.map((row) => `<tr><td><strong>${escapeHtml(row.country)}</strong></td><td>${escapeHtml(row.region)}</td><td class="numeric">${number(row.government_ai_readiness_score, 1)}</td><td class="numeric">${number(row.aipi_score, 3)}</td><td class="numeric">${number(row.government_policy_capacity, 1)}</td><td class="numeric">${number(row.government_ai_governance, 1)}</td><td class="numeric">${number(row.government_public_sector_adoption, 1)}</td><td class="numeric">${number(row.government_ai_resilience, 1)}</td></tr>`).join("")}</tbody>`;
  }

  function renderIndexComparison() {
    const rows = datasets.index_comparison;
    const width = 760;
    const height = 400;
    const margin = { left: 56, right: 20, top: 18, bottom: 48 };
    const x = (value) => margin.left + (value / 1) * (width - margin.left - margin.right);
    const y = (value) => height - margin.bottom - (value / 100) * (height - margin.top - margin.bottom);
    const xTicks = [0, 0.25, 0.5, 0.75, 1];
    const yTicks = [0, 25, 50, 75, 100];
    const svg = `<div class="scatter-wrap"><svg class="scatter" viewBox="0 0 ${width} ${height}" role="img" aria-label="Comparación entre AIPI y Oxford 2025">${xTicks.map((tick) => `<line class="grid" x1="${x(tick)}" x2="${x(tick)}" y1="${margin.top}" y2="${height - margin.bottom}"></line><text x="${x(tick)}" y="${height - 22}" text-anchor="middle">${number(tick, 2)}</text>`).join("")}${yTicks.map((tick) => `<line class="grid" x1="${margin.left}" x2="${width - margin.right}" y1="${y(tick)}" y2="${y(tick)}"></line><text x="${margin.left - 10}" y="${y(tick) + 4}" text-anchor="end">${tick}</text>`).join("")}<line class="axis" x1="${margin.left}" x2="${width - margin.right}" y1="${height - margin.bottom}" y2="${height - margin.bottom}"></line><line class="axis" x1="${margin.left}" x2="${margin.left}" y1="${margin.top}" y2="${height - margin.bottom}"></line><text x="${width / 2}" y="${height - 3}" text-anchor="middle">FMI AIPI 2023 (0-1)</text><text transform="translate(14 ${height / 2}) rotate(-90)" text-anchor="middle">Oxford 2025 (0-100)</text>${rows.map((row) => `<circle data-country="${escapeHtml(row.country)}" data-region="${escapeHtml(row.region)}" data-aipi="${row.aipi_score}" data-oxford="${row.government_ai_readiness_score}" cx="${x(row.aipi_score)}" cy="${y(row.government_ai_readiness_score)}" r="5" fill="${regionColors.get(row.region) ?? palette.neutral}"></circle>`).join("")}</svg></div>${regionLegend()}`;
    document.getElementById("governance-comparison").innerHTML = svg;
    document.querySelectorAll("#governance-comparison circle").forEach((circle) => {
      const content = `<strong>${escapeHtml(circle.dataset.country)}</strong><br>${escapeHtml(circle.dataset.region)}<br>Oxford: <b>${number(Number(circle.dataset.oxford), 1)}</b><br>AIPI: <b>${number(Number(circle.dataset.aipi), 3)}</b>`;
      circle.addEventListener("pointermove", (event) => showTooltip(event, content));
      circle.addEventListener("pointerleave", hideTooltip);
    });
  }

  function renderGovernance() {
    setMetricStrip("governance-metrics", [
      metricCard("Oxford 2025", integer(global.government_readiness_countries), `${number(global.government_readiness_coverage_pct, 1)} % del catálogo`, palette.gold),
      metricCard("Oxford medio", number(global.government_readiness_average, 1), `Mediana ${number(global.government_readiness_median, 1)}`, palette.gold),
      metricCard("Países AIPI", integer(global.aipi_countries), `${number(global.aipi_coverage_pct, 1)} % del catálogo`, palette.teal),
      metricCard("AIPI medio", number(global.aipi_average, 3), `Mediana ${number(global.aipi_median, 3)}`, palette.teal),
      metricCard("Cobertura dual", integer(datasets.index_comparison.length), "Países comparables", palette.coral),
    ]);
    renderRegionalStacks("governance-components");
    renderBarList("governance-oxford-regions", regions, { field: "government_readiness_average", labelField: "region", max: 75, digits: 1, color: palette.gold, note: (row) => `${row.government_readiness_countries} países` });
    renderIndexComparison();
    renderGovernanceTable(document.getElementById("governance-search").value);
  }

  function renderSources() {
    const sourceDescriptions = new Map(artifact.sources.map((source) => [source.id, source]));
    document.getElementById("source-cards").innerHTML = artifact.manifest.sources.map((source) => {
      const detail = sourceDescriptions.get(source.id);
      const description = detail?.query?.description ?? "Fuente normalizada del observatorio.";
      const reference = /^https?:\/\//.test(source.path)
        ? `<a href="${escapeHtml(source.path)}" target="_blank" rel="noreferrer">Fuente oficial</a>`
        : `<code>${escapeHtml(source.path)}</code>`;
      return `<article class="source-card"><strong>${escapeHtml(source.label)}</strong><p>${escapeHtml(description)}</p>${reference}</article>`;
    }).join("");
    document.getElementById("source-health-table").innerHTML = `<thead><tr><th>Conector</th><th>Estado</th><th>Actualización</th><th>SHA-256</th></tr></thead><tbody>${datasets.source_health.map((row) => `<tr><td><strong>${escapeHtml(row.source)}</strong></td><td><span class="status ${row.status === "ok" ? "" : "error"}">${row.status === "ok" ? "Operativo" : "No disponible"}</span></td><td>${escapeHtml(new Date(row.updated_at).toLocaleString("es-ES"))}</td><td><code>${escapeHtml(row.checksum)}</code></td></tr>`).join("")}</tbody>`;
  }

  function setView(view) {
    state.view = view;
    document.querySelectorAll(".view").forEach((section) => section.classList.toggle("active", section.dataset.view === view));
    document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.viewTarget === view));
    document.getElementById("primary-nav").classList.remove("open");
    document.getElementById("nav-toggle").setAttribute("aria-expanded", "false");
    if (view === "global") renderGlobal();
    if (view === "regions") renderRegions();
    if (view === "countries") renderCountries();
    if (view === "education") renderEducation();
    if (view === "business") renderBusiness();
    if (view === "governance") renderGovernance();
    if (view === "sources") renderSources();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function initializeControls() {
    const regionOptions = [["Todas las regiones", "Todas las regiones"], ...regions.map((row) => [row.region, row.region])];
    populateSelect(document.getElementById("global-region-filter"), regionOptions, state.region);
    const defaultRegion = regions.find((row) => row.region === "América Latina y el Caribe")?.region ?? regions[0].region;
    populateSelect(document.getElementById("region-select"), regions.map((row) => [row.region, row.region]), defaultRegion);
    populateSelect(document.getElementById("country-select"), profiles.map((row) => [row.iso3, `${row.country} · ${row.region}`]), state.country);
    populateSelect(document.getElementById("map-metric"), Object.entries(mapMetrics).map(([id, metric]) => [id, metric.label]), state.mapMetric);

    document.querySelectorAll(".nav-item").forEach((button) => button.addEventListener("click", () => setView(button.dataset.viewTarget)));
    document.getElementById("nav-toggle").addEventListener("click", (event) => {
      const nav = document.getElementById("primary-nav");
      const open = nav.classList.toggle("open");
      event.currentTarget.setAttribute("aria-expanded", String(open));
    });
    document.getElementById("global-region-filter").addEventListener("change", (event) => { state.region = event.target.value; renderMap(); });
    document.getElementById("map-metric").addEventListener("change", (event) => { state.mapMetric = event.target.value; renderMap(); });
    document.getElementById("region-select").addEventListener("change", renderRegions);
    document.getElementById("country-select").addEventListener("change", (event) => { state.country = event.target.value; renderCountries(); });
    document.getElementById("governance-search").addEventListener("input", (event) => renderGovernanceTable(event.target.value));
  }

  function initialize() {
    const generated = new Date(artifact.snapshot.generatedAt);
    const freshness = `Actualizado ${generated.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}`;
    document.getElementById("freshness-label").textContent = freshness;
    document.getElementById("footer-freshness").textContent = freshness;
    initializeControls();
    renderGlobal();
  }

  initialize();
})();
