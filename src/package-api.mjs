import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { readJson, writeJson } from "./lib/io.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const siteDirectory = join(root, "_site");
const apiDirectory = join(siteDirectory, "api", "v1");
const countriesApiDirectory = join(apiDirectory, "countries");
const baseUrl = "https://rinconcd67.github.io/observatorio-ia-educacion-empresa/api/v1";

export async function packageApi() {
  const [artifact, snapshot, packageDefinition, nationalStrategies, riskTaxonomy, educationEvidence, cima, finance, cepal] = await Promise.all([
    readJson(join(root, "dashboard", "artifact.json")),
    readJson(join(root, "data", "processed", "snapshot.json")),
    readJson(join(root, "package.json")),
    readJson(join(root, "src", "content", "national-ai-strategies.json")),
    readJson(join(root, "src", "content", "ai-risk-taxonomy.json")),
    readJson(join(root, "data", "processed", "education-evidence.json")),
    readJson(join(root, "data", "processed", "cima-context.json")),
    readJson(join(root, "data", "processed", "education-finance.json")),
    readJson(join(root, "data", "processed", "cepal-context.json")),
  ]);

  await mkdir(countriesApiDirectory, { recursive: true });

  const profiles = artifact.snapshot.datasets.country_profile ?? [];
  const version = packageDefinition.version;
  const generatedAt = snapshot.generated_at;

  const author = {
    name: "César David Rincón Godoy",
    orcid: "https://orcid.org/0009-0003-2112-3851",
    scholar: "https://scholar.google.com/citations?user=jwtoI84AAAAJ",
    affiliation: "Broward International University",
  };

  const citation = {
    text: `Rincón Godoy, C. D. (2026). Observatorio Global de Inteligencia Artificial en Educación y Empresa (versión ${version}) [API REST de datos abiertos]. Broward International University. https://doi.org/10.5281/zenodo.24140002`,
    doi: "10.5281/zenodo.24140002",
    concept_doi: "10.5281/zenodo.24140001",
    license: "https://creativecommons.org/licenses/by/4.0/",
  };

  // 1. API Index
  const apiIndex = {
    name: "Observatorio Global de Inteligencia Artificial en Educación y Empresa — Open API v1",
    version,
    schema_version: "1.0.0",
    generated_at: generatedAt,
    base_url: baseUrl,
    author,
    citation,
    documentation: {
      description_es: "API pública estática para consulta, investigación y reproducibilidad académica sobre preparación, adopción y gobernanza de la inteligencia artificial en educación y empresa.",
      description_en: "Static public API for research, open querying and academic reproducibility on AI preparedness, adoption, and governance across education and business ecosystems.",
      endpoints: {
        index: `${baseUrl}/index.json`,
        countries_catalog: `${baseUrl}/countries.json`,
        country_dossier_template: `${baseUrl}/countries/{iso3}.json`,
        risk_taxonomy: `${baseUrl}/risk-taxonomy.json`,
      },
      usage_examples: {
        curl: `curl -s "${baseUrl}/countries/COL.json"`,
        python: `import requests\ndata = requests.get("${baseUrl}/countries/CHL.json").json()\nprint(data["macro_indicators"]["aipi_2023"])`,
        r: `library(jsonlite)\ncol <- fromJSON("${baseUrl}/countries/COL.json")`,
      },
    },
    coverage: {
      total_countries: profiles.length,
      direct_ai_countries: artifact.snapshot.datasets.global_summary[0]?.direct_countries ?? 0,
      aipi_countries: artifact.snapshot.datasets.global_summary[0]?.aipi_countries ?? 0,
      oxford_countries: artifact.snapshot.datasets.global_summary[0]?.government_readiness_countries ?? 0,
    },
  };
  await writeJson(join(apiDirectory, "index.json"), apiIndex);

  // 2. Risk Taxonomy Endpoint
  await writeJson(join(apiDirectory, "risk-taxonomy.json"), riskTaxonomy);

  // 3. Countries Catalog
  const countriesCatalog = {
    total_countries: profiles.length,
    generated_at: generatedAt,
    countries: profiles.map((p) => ({
      iso3: p.iso3,
      iso2: p.iso2,
      country_es: p.country,
      country_en: p.country_source_name ?? p.country,
      region: p.region,
      income_group: p.income_group,
      has_direct_ai_data: Number.isFinite(p.formal_education_ai_pct) || Number.isFinite(p.enterprise_ai_pct),
      has_national_strategy: Boolean(nationalStrategies.strategies?.[p.iso3]),
      endpoint: `/api/v1/countries/${p.iso3}.json`,
      url: `${baseUrl}/countries/${p.iso3}.json`,
    })),
  };
  await writeJson(join(apiDirectory, "countries.json"), countriesCatalog);

  // 4. Individual Country Endpoints (218 files)
  for (const row of profiles) {
    const iso3 = row.iso3;
    const strat = nationalStrategies.strategies?.[iso3] ?? null;

    // Filter regional layers for this country
    const talisTeacherRows = (educationEvidence.observations ?? []).filter((r) => r.iso3 === iso3);
    const talisSchoolRows = (educationEvidence.institutional ?? []).filter((r) => r.iso3 === iso3);
    const cimaRows = (cima.observations ?? []).filter((r) => r.iso3 === iso3);
    const financeRows = (finance.observations ?? []).filter((r) => r.iso3 === iso3);

    const cepalObservations = [];
    for (const s of (cepal.series ?? [])) {
      const match = (s.observations ?? []).filter((r) => r.iso3 === iso3);
      if (match.length) {
        cepalObservations.push({
          series_id: s.id,
          series_title: s.title,
          data: match,
        });
      }
    }

    const countryDossier = {
      schema_version: "1.0.0",
      generated_at: generatedAt,
      version,
      country: {
        iso3: row.iso3,
        iso2: row.iso2,
        name_es: row.country,
        name_en: row.country_source_name ?? row.country,
        region: row.region,
        income_group: row.income_group,
      },
      macro_indicators: {
        aipi_2023: {
          score: row.aipi_2023 ?? null,
          year: 2023,
          components: {
            digital_infrastructure: row.aipi_infrastructure ?? null,
            innovation_integration: row.aipi_innovation ?? null,
            human_capital: row.aipi_human_capital ?? null,
            regulation_ethics: row.aipi_regulation ?? null,
          },
          source: "International Monetary Fund (IMF)",
        },
        oxford_government_ai_readiness_2025: {
          score: row.government_ai_readiness_2025 ?? null,
          year: row.government_ai_readiness_year ?? 2025,
          pillars: {
            policy_capacity: row.government_policy_capacity ?? null,
            ai_infrastructure: row.government_ai_infrastructure ?? null,
            ai_governance: row.government_ai_governance ?? null,
            public_sector_adoption: row.government_public_sector_adoption ?? null,
            development_diffusion: row.government_development_diffusion ?? null,
            ai_resilience: row.government_ai_resilience ?? null,
          },
          source: "Oxford Insights",
        },
        context: {
          internet_users_pct: row.internet_users_pct ?? null,
          internet_year: row.internet_year ?? null,
          tertiary_enrollment_pct: row.tertiary_enrollment_pct ?? null,
          tertiary_year: row.tertiary_year ?? null,
          gdp_per_capita_usd: row.gdp_per_capita_usd ?? null,
          gdp_year: row.gdp_year ?? null,
          source: "World Bank Development Indicators",
        },
      },
      sectoral_ai_adoption: {
        enterprise_ai_pct: row.enterprise_ai_pct ?? null,
        enterprise_year: row.enterprise_year ?? null,
        enterprise_source: row.enterprise_source ?? null,
        formal_education_ai_pct: row.formal_education_ai_pct ?? null,
        formal_education_year: row.formal_education_year ?? null,
        student_ai_pct: row.student_ai_pct ?? null,
        student_year: row.student_year ?? null,
        individual_genai_pct: row.individual_genai_pct ?? null,
        individual_year: row.individual_year ?? null,
        adoption_gap_pp: row.adoption_gap_pp ?? null,
        gap_comparability: row.gap_comparability ?? "not_comparable",
      },
      national_ai_strategy: strat ? {
        strategy_es: strat.strategy_es,
        strategy_en: strat.strategy_en,
        status_es: strat.status_es,
        status_en: strat.status_en,
        year: strat.year,
        authority: strat.authority,
        ethics_framework_es: strat.ethics_framework_es,
        ethics_framework_en: strat.ethics_framework_en,
        unesco_ram_es: strat.unesco_ram_es,
        unesco_ram_en: strat.unesco_ram_en,
        framework: nationalStrategies.framework,
      } : null,
      complementary_evidence: {
        talis_teachers_2024: talisTeacherRows.length ? talisTeacherRows : null,
        institutional_schools: talisSchoolRows.length ? talisSchoolRows : null,
        cima_pisa_learning: cimaRows.length ? cimaRows : null,
        unesco_uis_finance: financeRows.length ? financeRows : null,
        cepalstat_connectivity: cepalObservations.length ? cepalObservations : null,
      },
      author,
      citation,
    };

    await writeJson(join(countriesApiDirectory, `${iso3}.json`), countryDossier);
  }

  return {
    ok: true,
    total_endpoints: profiles.length + 3,
    countries: profiles.length,
    directory: apiDirectory,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  packageApi()
    .then((res) => console.log(JSON.stringify(res)))
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    });
}
