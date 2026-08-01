import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { readJson, writeJson } from "./lib/io.mjs";
import { indexBy, latestByPriority, mean, round } from "./lib/metrics.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const snapshotPath = join(root, "data", "processed", "snapshot.json");
const artifactPath = join(root, "dashboard", "artifact.json");

function metricRows(observations, metricId) {
  return observations.filter((row) => row.metric_id === metricId);
}

const SOURCE_PRIORITY = {
  eurostat_enterprise_ai: 20,
  oecd_ict_businesses: 10,
};

export function latestMetricMap(observations, metricId) {
  const rows = latestByPriority(metricRows(observations, metricId), ["iso3"], SOURCE_PRIORITY);
  return indexBy(rows, "iso3");
}

function trendDataset(observations, metricId) {
  const byYear = new Map();
  const rows = latestByPriority(metricRows(observations, metricId), ["iso3", "year"], SOURCE_PRIORITY);
  for (const row of rows) {
    if (!byYear.has(row.year)) byYear.set(row.year, []);
    byYear.get(row.year).push(row.value);
  }
  return [...byYear.entries()]
    .sort(([left], [right]) => left - right)
    .map(([year, values]) => ({
      year: String(year),
      adoption_pct: round(mean(values)),
      countries: values.length,
    }));
}

function directCountries(...maps) {
  return new Set(maps.flatMap((map) => [...map.keys()]));
}

function sourceDefinitions(snapshot) {
  const executedAt = snapshot.generated_at;
  const sources = [
    {
      id: "processed_snapshot",
      label: "Snapshot normalizado del Observatorio",
      path: "data/processed/snapshot.json",
      query: {
        engine: "duckdb",
        language: "sql",
        sql: "SELECT * FROM read_json_auto('data/processed/observations.json')",
        description: "Normaliza países, periodos, unidades y procedencia de las APIs activas.",
        executed_at: executedAt,
        tables_used: ["data/processed/snapshot.json"],
        metric_definitions: {
          country_coverage: "Número de países con al menos una observación directa de uso de IA en educación o empresas.",
          unweighted_average: "Promedio aritmético no ponderado de los países con observación disponible; no representa un promedio poblacional de la UE.",
          adoption_gap: "Diferencia en puntos porcentuales entre uso empresarial de IA y uso de IA generativa para educación formal en el mismo país y año disponible."
        }
      }
    },
    {
      id: "oecd_ict",
      label: "OCDE - Uso de TIC por empresas e individuos",
      path: "https://data-explorer.oecd.org/",
      query: {
        engine: "duckdb",
        language: "sql",
        sql: "SELECT * FROM read_json_auto('data/processed/observations.json') WHERE source_id IN ('oecd_ict_businesses', 'oecd_individual_genai')",
        description: "Amplía la cobertura de adopción empresarial y uso individual de IA generativa. Eurostat tiene precedencia en coincidencias del mismo país y año.",
        executed_at: executedAt,
        tables_used: ["DSD_ICT_B@DF_BUSINESSES", "DSD_ICT_HH_IND@DF_IND"],
        filters: ["empresas de 10 o más personas", "actividad total", "personas de 16 a 74 años", "última observación disponible"]
      }
    },
    {
      id: "imf_aipi",
      label: "FMI - AI Preparedness Index",
      path: "https://www.imf.org/external/datamapper/datasets/AIPI",
      query: {
        engine: "duckdb",
        language: "sql",
        sql: "SELECT * FROM read_json_auto('data/processed/observations.json') WHERE source_id = 'imf_aipi'",
        url: "https://www.imf.org/external/datamapper/aipidata.xlsx",
        description: "Índice indicativo de preparación para IA y contribuciones de cuatro dimensiones estructurales, edición 2023.",
        executed_at: executedAt,
        tables_used: ["aipidata.xlsx!AIPI"],
        filters: ["se excluyen agregados", "sin imputación", "no se usa como ranking"]
      }
    },
    {
      id: "eurostat_enterprise_ai",
      label: "Eurostat isoc_eb_ai",
      path: "https://ec.europa.eu/eurostat/databrowser/view/isoc_eb_ai/default/table",
      query: {
        engine: "duckdb",
        language: "sql",
        sql: "SELECT * FROM read_json_auto('data/processed/observations.json') WHERE source_id = 'eurostat_enterprise_ai'",
        url: "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/isoc_eb_ai?lang=en&freq=A&size_emp=GE10&nace_r2=C10-S951_X_K&indic_is=E_AI_TANY&unit=PC_ENT",
        description: "Empresas con diez o más personas empleadas que usan al menos una tecnología de IA, por país y año.",
        executed_at: executedAt,
        tables_used: ["Eurostat.isoc_eb_ai"],
        filters: ["size_emp=GE10", "nace_r2=C10-S951_X_K", "indic_is=E_AI_TANY", "unit=PC_ENT"]
      }
    },
    {
      id: "eurostat_formal_education_ai",
      label: "Eurostat isoc_ai_iaiu",
      path: "https://ec.europa.eu/eurostat/databrowser/view/isoc_ai_iaiu/default/table",
      query: {
        engine: "duckdb",
        language: "sql",
        sql: "SELECT * FROM read_json_auto('data/processed/observations.json') WHERE source_id = 'eurostat_formal_education_ai'",
        url: "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/isoc_ai_iaiu?lang=en&freq=A&ind_type=IND_TOTAL&indic_is=I_IUAIFE&unit=PC_IND&time=2025",
        description: "Individuos que usaron herramientas de IA generativa para educación formal en 2025.",
        executed_at: executedAt,
        tables_used: ["Eurostat.isoc_ai_iaiu"],
        filters: ["ind_type=IND_TOTAL", "indic_is=I_IUAIFE", "unit=PC_IND", "time=2025"]
      }
    },
    {
      id: "eurostat_student_ai",
      label: "Eurostat isoc_ai_iaiu - estudiantes",
      path: "https://ec.europa.eu/eurostat/databrowser/view/isoc_ai_iaiu/default/table",
      query: {
        engine: "duckdb",
        language: "sql",
        sql: "SELECT * FROM read_json_auto('data/processed/observations.json') WHERE source_id = 'eurostat_student_ai'",
        url: "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/isoc_ai_iaiu?lang=en&freq=A&ind_type=STUD&indic_is=I_IUAI&unit=PC_IND&time=2025",
        description: "Estudiantes que usaron herramientas de IA generativa en 2025.",
        executed_at: executedAt,
        tables_used: ["Eurostat.isoc_ai_iaiu"],
        filters: ["ind_type=STUD", "indic_is=I_IUAI", "unit=PC_IND", "time=2025"]
      }
    },
    {
      id: "world_bank_context",
      label: "Banco Mundial - Indicadores de contexto",
      path: "https://data.worldbank.org/",
      query: {
        engine: "duckdb",
        language: "sql",
        sql: "SELECT * FROM read_json_auto('data/processed/observations.json') WHERE source_id LIKE 'world_bank_%'",
        description: "Última observación disponible entre 2020 y 2025 para conectividad, matrícula terciaria y PIB per cápita.",
        executed_at: executedAt,
        tables_used: ["IT.NET.USER.ZS", "SE.TER.ENRR", "NY.GDP.PCAP.CD"],
        filters: ["date=2020:2025", "country=all", "se excluyen agregados regionales"]
      }
    }
  ];
  return sources;
}

export function createArtifact(snapshot) {
  const enterprise = latestMetricMap(snapshot.observations, "enterprise_ai_adoption");
  const formalEducation = latestMetricMap(snapshot.observations, "formal_education_genai_use");
  const students = latestMetricMap(snapshot.observations, "student_genai_use");
  const individuals = latestMetricMap(snapshot.observations, "individual_genai_use");
  const aipi = latestMetricMap(snapshot.observations, "ai_preparedness_index");
  const digital = latestMetricMap(snapshot.observations, "ai_digital_infrastructure");
  const innovation = latestMetricMap(snapshot.observations, "ai_innovation_integration");
  const humanCapital = latestMetricMap(snapshot.observations, "ai_human_capital");
  const regulation = latestMetricMap(snapshot.observations, "ai_regulation_ethics");
  const internet = latestMetricMap(snapshot.observations, "internet_users");
  const tertiary = latestMetricMap(snapshot.observations, "tertiary_enrollment");
  const gdp = latestMetricMap(snapshot.observations, "gdp_per_capita");
  const countries = indexBy(snapshot.countries, "iso3");
  const directIso3 = directCountries(enterprise, formalEducation, students, individuals);
  const coveredIso3 = directCountries(enterprise, formalEducation, students, individuals, aipi);

  const countryProfile = [...coveredIso3].flatMap((iso3) => {
    const country = countries.get(iso3);
    if (!country) return [];
    const business = enterprise.get(iso3);
    const education = formalEducation.get(iso3);
    const student = students.get(iso3);
    const individual = individuals.get(iso3);
    const aipiRow = aipi.get(iso3);
    const internetRow = internet.get(iso3);
    const tertiaryRow = tertiary.get(iso3);
    const gdpRow = gdp.get(iso3);
    return [{
      iso3,
      country: country.country,
      region: country.region,
      income_group: country.income_group,
      business_ai_pct: business?.value ?? null,
      business_year: business?.year ?? null,
      formal_education_ai_pct: education?.value ?? null,
      education_year: education?.year ?? null,
      student_ai_pct: student?.value ?? null,
      student_year: student?.year ?? null,
      individual_genai_pct: individual?.value ?? null,
      individual_genai_year: individual?.year ?? null,
      aipi_score: aipiRow?.value == null ? null : round(aipiRow.value, 3),
      aipi_year: aipiRow?.year ?? null,
      aipi_digital_contribution: digital.get(iso3)?.value == null ? null : round(digital.get(iso3).value, 3),
      aipi_innovation_contribution: innovation.get(iso3)?.value == null ? null : round(innovation.get(iso3).value, 3),
      aipi_human_capital_contribution: humanCapital.get(iso3)?.value == null ? null : round(humanCapital.get(iso3).value, 3),
      aipi_regulation_contribution: regulation.get(iso3)?.value == null ? null : round(regulation.get(iso3).value, 3),
      adoption_gap_pp: business && education ? round(business.value - education.value) : null,
      internet_users_pct: internetRow?.value == null ? null : round(internetRow.value),
      internet_year: internetRow?.year ?? null,
      tertiary_enrollment_pct: tertiaryRow?.value == null ? null : round(tertiaryRow.value),
      tertiary_year: tertiaryRow?.year ?? null,
      gdp_per_capita_usd: gdpRow?.value == null ? null : round(gdpRow.value, 0),
      gdp_year: gdpRow?.year ?? null,
    }];
  }).sort((left, right) => left.country.localeCompare(right.country, "es"));

  const businessRanking = countryProfile
    .filter((row) => Number.isFinite(row.business_ai_pct))
    .sort((left, right) => right.business_ai_pct - left.business_ai_pct)
    .map((row, index) => ({ ...row, rank: index + 1 }));
  const educationRanking = countryProfile
    .filter((row) => Number.isFinite(row.formal_education_ai_pct))
    .sort((left, right) => right.formal_education_ai_pct - left.formal_education_ai_pct)
    .map((row, index) => ({ ...row, rank: index + 1 }));
  const individualCoverage = countryProfile
    .filter((row) => Number.isFinite(row.individual_genai_pct))
    .sort((left, right) => right.individual_genai_pct - left.individual_genai_pct);
  const gapAnalysis = countryProfile
    .filter((row) => Number.isFinite(row.adoption_gap_pp))
    .sort((left, right) => right.adoption_gap_pp - left.adoption_gap_pp);
  const studentValues = countryProfile.map((row) => row.student_ai_pct);
  const readinessAdoption = countryProfile
    .filter((row) => Number.isFinite(row.aipi_score) && Number.isFinite(row.business_ai_pct));

  const summary = [{
    countries_covered: directIso3.size,
    aipi_countries: aipi.size,
    business_average_pct: round(mean(businessRanking.map((row) => row.business_ai_pct))),
    education_average_pct: round(mean(educationRanking.map((row) => row.formal_education_ai_pct))),
    student_average_pct: round(mean(studentValues)),
    individual_genai_average_pct: round(mean(individualCoverage.map((row) => row.individual_genai_pct))),
    overlap_countries: gapAnalysis.length,
    active_sources: snapshot.healthy_sources_count,
  }];

  const sources = sourceDefinitions(snapshot);
  const sourceHealth = snapshot.source_runs.map((run) => ({
    source: run.source_id,
    status: run.status,
    updated_at: run.completed_at,
    checksum: run.checksum_sha256?.slice(0, 12) ?? "No disponible",
  }));

  const unavailableSources = snapshot.source_runs.filter((run) => run.status !== "ok");
  const caveatBody = unavailableSources.length
    ? `## Cobertura de la ejecución\n\nLas métricas centrales de adopción están disponibles. Las siguientes fuentes opcionales no respondieron en esta ejecución: ${unavailableSources.map((run) => `\`${run.source_id}\``).join(", ")}. Sus campos de contexto permanecen vacíos y no se imputan.`
    : "## Cobertura de la ejecución\n\nTodas las fuentes configuradas respondieron correctamente en esta ejecución.";

  return {
    surface: "dashboard",
    manifest: {
      version: 1,
      surface: "dashboard",
      title: "Observatorio de IA en Educación y Empresa",
      description: "Adopción de inteligencia artificial y condiciones de contexto por país.",
      generatedAt: snapshot.generated_at,
      filters: [{
        id: "country",
        label: "País",
        dataset: "country_profile",
        field: "country",
        defaultValue: countryProfile.some((row) => row.country === "Denmark") ? "Denmark" : countryProfile[0]?.country,
        includeAll: true,
      }],
      cards: [
        {
          id: "aipi_coverage",
          description: "Países con índice indicativo de preparación para IA del FMI en la edición 2023.",
          dataset: "summary",
          sourceId: "imf_aipi",
          metrics: [{ label: "Países con preparación AIPI", field: "aipi_countries", format: "number" }]
        },
        {
          id: "coverage",
          description: "Países con al menos una medición directa de uso o adopción de IA.",
          dataset: "summary",
          sourceId: "processed_snapshot",
          metrics: [{ label: "Países con datos de IA", field: "countries_covered", format: "number" }]
        },
        {
          id: "business_average",
          description: "Promedio no ponderado del porcentaje nacional de empresas con diez o más personas empleadas que usan IA.",
          dataset: "summary",
          sourceId: "processed_snapshot",
          metrics: [{ label: "Adopción empresarial media (%)", field: "business_average_pct", format: "number" }]
        },
        {
          id: "education_average",
          description: "Promedio no ponderado del uso de IA generativa para educación formal entre individuos.",
          dataset: "summary",
          sourceId: "eurostat_formal_education_ai",
          metrics: [{ label: "Uso para educación formal (%)", field: "education_average_pct", format: "number" }]
        },
        {
          id: "individual_average",
          description: "Promedio no ponderado del uso individual de herramientas de IA generativa entre personas de 16 a 74 años.",
          dataset: "summary",
          sourceId: "oecd_ict",
          metrics: [{ label: "Uso individual de GenAI (%)", field: "individual_genai_average_pct", format: "number" }]
        },
        {
          id: "active_sources",
          description: "Conectores que respondieron correctamente en la ejecución que produjo este snapshot.",
          dataset: "summary",
          sourceId: "processed_snapshot",
          metrics: [{ label: "Fuentes operativas", field: "active_sources", format: "number" }]
        }
      ],
      charts: [
        {
          id: "business_trend",
          title: "Evolución de la adopción empresarial de IA",
          subtitle: "Promedio no ponderado de los países con observación en cada año.",
          type: "line",
          dataset: "business_trend",
          sourceId: "processed_snapshot",
          valueFormat: "number",
          encodings: {
            x: { field: "year", type: "ordinal", label: "Año" },
            y: { field: "adoption_pct", type: "quantitative", label: "Empresas que usan IA (%)" },
            tooltip: [{ field: "countries", type: "quantitative", label: "Países" }]
          }
        },
        {
          id: "business_ranking",
          title: "Países con mayor adopción empresarial de IA",
          subtitle: "Empresas con diez o más personas empleadas; última observación disponible.",
          type: "bar",
          dataset: "business_top",
          sourceId: "processed_snapshot",
          valueFormat: "number",
          encodings: {
            x: { field: "country", type: "nominal", label: "País" },
            y: { field: "business_ai_pct", type: "quantitative", label: "Empresas que usan IA (%)" },
            tooltip: [{ field: "business_year", type: "quantitative", label: "Año" }]
          }
        },
        {
          id: "individual_ranking",
          title: "Uso individual de herramientas de IA generativa",
          subtitle: "Personas de 16 a 74 años; última observación disponible en la OCDE.",
          type: "bar",
          dataset: "individual_top",
          sourceId: "oecd_ict",
          valueFormat: "number",
          encodings: {
            x: { field: "country", type: "nominal", label: "País" },
            y: { field: "individual_genai_pct", type: "quantitative", label: "Personas que usan GenAI (%)" },
            tooltip: [{ field: "individual_genai_year", type: "quantitative", label: "Año" }]
          }
        },
        {
          id: "readiness_adoption_scatter",
          title: "Preparación nacional frente a adopción empresarial",
          subtitle: "Relación descriptiva; AIPI es un índice indicativo y no una clasificación de desempeño.",
          type: "scatter",
          dataset: "readiness_adoption",
          sourceId: "processed_snapshot",
          encodings: {
            x: { field: "aipi_score", type: "quantitative", label: "Índice AIPI (0-1)" },
            y: { field: "business_ai_pct", type: "quantitative", label: "Empresas que usan IA (%)" },
            tooltip: [
              { field: "country", type: "nominal", label: "País" },
              { field: "business_year", type: "quantitative", label: "Año empresarial" }
            ]
          }
        },
        {
          id: "education_ranking",
          title: "Uso de IA generativa para educación formal",
          subtitle: "Porcentaje de individuos; datos de 2025.",
          type: "bar",
          dataset: "education_top",
          sourceId: "eurostat_formal_education_ai",
          valueFormat: "number",
          encodings: {
            x: { field: "country", type: "nominal", label: "País" },
            y: { field: "formal_education_ai_pct", type: "quantitative", label: "Uso para educación formal (%)" }
          }
        },
        {
          id: "gap_scatter",
          title: "Adopción empresarial frente a uso educativo",
          subtitle: "Cada punto representa un país con ambas mediciones disponibles.",
          type: "scatter",
          dataset: "gap_analysis",
          sourceId: "processed_snapshot",
          encodings: {
            x: { field: "formal_education_ai_pct", type: "quantitative", label: "Uso para educación formal (%)" },
            y: { field: "business_ai_pct", type: "quantitative", label: "Empresas que usan IA (%)" },
            tooltip: [
              { field: "country", type: "nominal", label: "País" },
              { field: "adoption_gap_pp", type: "quantitative", label: "Brecha (pp)" }
            ]
          }
        }
      ],
      tables: [
        {
          id: "country_table",
          title: "Radar país y variables de contexto",
          subtitle: "La ausencia de dato se mantiene explícita; los años de contexto pueden diferir por indicador.",
          dataset: "country_profile",
          sourceId: "processed_snapshot",
          defaultSort: { field: "country", direction: "asc" },
          density: "dense",
          layout: "full",
          columns: [
            { field: "country", label: "País", type: "text" },
            { field: "business_ai_pct", label: "IA en empresas (%)", format: "number" },
            { field: "formal_education_ai_pct", label: "IA para educación (%)", format: "number" },
            { field: "student_ai_pct", label: "IA entre estudiantes (%)", format: "number" },
            { field: "individual_genai_pct", label: "Uso individual de GenAI (%)", format: "number" },
            { field: "aipi_score", label: "Preparación AIPI (0-1)", format: "number" },
            { field: "adoption_gap_pp", label: "Brecha empresa-educación (pp)", format: "number", movement: true },
            { field: "internet_users_pct", label: "Uso de Internet (%)", format: "number" },
            { field: "tertiary_enrollment_pct", label: "Matrícula terciaria (%)", format: "number" },
            { field: "gdp_per_capita_usd", label: "PIB per cápita (USD)", format: "number" }
          ]
        },
        {
          id: "aipi_dimensions",
          title: "Componentes del índice de preparación para IA",
          subtitle: "Contribuciones ponderadas al AIPI 2023; cada componente se expresa de 0 a 0,25.",
          dataset: "country_profile",
          sourceId: "imf_aipi",
          defaultSort: { field: "country", direction: "asc" },
          density: "dense",
          layout: "full",
          columns: [
            { field: "country", label: "País", type: "text" },
            { field: "aipi_score", label: "AIPI (0-1)", format: "number" },
            { field: "aipi_digital_contribution", label: "Infraestructura digital", format: "number" },
            { field: "aipi_innovation_contribution", label: "Innovación e integración", format: "number" },
            { field: "aipi_human_capital_contribution", label: "Capital humano y trabajo", format: "number" },
            { field: "aipi_regulation_contribution", label: "Regulación y ética", format: "number" }
          ]
        },
        {
          id: "source_health",
          title: "Trazabilidad y salud de fuentes",
          subtitle: "Estado y huella de la ejecución que produjo el snapshot.",
          dataset: "source_health",
          sourceId: "processed_snapshot",
          defaultSort: { field: "source", direction: "asc" },
          density: "dense",
          layout: "full",
          columns: [
            { field: "source", label: "Fuente", type: "text" },
            { field: "status", label: "Estado", type: "text" },
            { field: "updated_at", label: "Actualización", type: "text" },
            { field: "checksum", label: "SHA-256 abreviado", type: "text" }
          ]
        }
      ],
      sources: sources.map((source) => ({ id: source.id, label: source.label, path: source.path })),
      blocks: [
        { id: "metrics", type: "metric-strip", cardIds: ["coverage", "aipi_coverage", "business_average", "education_average", "individual_average", "active_sources"] },
        { id: "business_trend_block", type: "chart", chartId: "business_trend", layout: "full" },
        { id: "business_ranking_block", type: "chart", chartId: "business_ranking", layout: "half" },
        { id: "education_ranking_block", type: "chart", chartId: "education_ranking", layout: "half" },
        { id: "individual_ranking_block", type: "chart", chartId: "individual_ranking", layout: "half" },
        { id: "gap_block", type: "chart", chartId: "gap_scatter", layout: "full" },
        { id: "readiness_adoption_block", type: "chart", chartId: "readiness_adoption_scatter", layout: "full" },
        { id: "coverage_note", type: "markdown", body: caveatBody },
        { id: "country_block", type: "table", tableId: "country_table", layout: "full" },
        { id: "aipi_dimensions_block", type: "table", tableId: "aipi_dimensions", layout: "full" },
        {
          id: "method_note",
          type: "markdown",
          body: "## Lectura metodológica\n\nLos promedios son simples y no ponderados. Las métricas educativas, individuales y empresariales representan poblaciones distintas y no deben interpretarse como equivalentes causales. AIPI describe preparación estructural de forma indicativa: sirve para orientar el análisis, no para construir una clasificación competitiva de países."
        },
        { id: "health_block", type: "table", tableId: "source_health", layout: "full" }
      ]
    },
    snapshot: {
      version: 1,
      generatedAt: snapshot.generated_at,
      status: "ready",
      datasets: {
        summary,
        business_trend: trendDataset(snapshot.observations, "enterprise_ai_adoption"),
        business_top: businessRanking.slice(0, 15),
        education_top: educationRanking.slice(0, 15),
        individual_top: individualCoverage.slice(0, 15),
        gap_analysis: gapAnalysis,
        readiness_adoption: readinessAdoption,
        country_profile: countryProfile,
        source_health: sourceHealth
      }
    },
    sources,
    package_info: {
      root: "observatorio-ia-educacion-empresa",
      manifestPath: "dashboard/artifact.json",
      snapshotPath: "data/processed/snapshot.json"
    }
  };
}

export async function buildArtifact() {
  const snapshot = await readJson(snapshotPath);
  const artifact = createArtifact(snapshot);
  await writeJson(artifactPath, artifact);
  return artifact;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildArtifact()
    .then((artifact) => {
      console.log(JSON.stringify({
        ok: true,
        artifact: "dashboard/artifact.json",
        datasets: Object.keys(artifact.snapshot.datasets).length,
        blocks: artifact.manifest.blocks.length,
      }));
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
