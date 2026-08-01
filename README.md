# Global AI Observatory for Education and Business

[Español](README.es.md) | **English**

A reproducible, bilingual system for monitoring artificial intelligence preparedness, adoption and use in education, business and government by country and region.

## Version 0.4.0

- Two equivalent public routes: Spanish at `/` and English at `/en/`.
- Eight views: Global, Regions, Countries, Education, Business, Governance, Sources and About.
- One shared, auditable analytical contract for both languages.
- 218 countries and economies, 7 world regions and 5,280 normalized observations.
- 165 countries with a complete IMF AIPI, 194 with Oxford Government AI Readiness 2025 and 40 with direct AI-use or adoption measurements.
- Eleven operational sources from public APIs and controlled official downloads.
- Localized country and region names, interface, maps, charts, tables, tooltips, dates and number formats.
- International SEO metadata, `hreflang`, structured data, bilingual manifests and language-specific social previews.
- Verifiable CSV/JSON downloads, authorship, ORCID, citation, data policy and privacy documentation.
- Monthly governed updates through a comparative report and pull request; automation does not publish new data without human review.

## Quick start

```bash
npm test
npm run build
npm run check
npm run serve
```

`npm run build` generates the self-contained dashboards in `dashboard/index.html` and `dashboard/en/index.html`, plus the GitHub Pages package in `_site/`. The local server exposes the public package at `http://127.0.0.1:4173`.

Public URLs:

- Spanish: <https://rinconcd67.github.io/observatorio-ia-educacion-empresa/>
- English: <https://rinconcd67.github.io/observatorio-ia-educacion-empresa/en/>

## Structure

```text
config/             Active connector registry
data/raw/           Original responses, excluded from Git
data/processed/     Normalized snapshot and tables
dashboard/          Analytical artifact and self-contained HTML
_site/              Generated public package, excluded from Git
data/reference/     Versioned public geometry and references
docs/               Methodology, data dictionary and operations
reports/            Comparative update reports
src/                Ingestion, transformation, validation and server
test/               Automated tests
```

## Trust principle

The observatory does not replace missing values with zero and does not reinterpret general connectivity or economic indicators as AI preparedness. Every visualization retains source, filters, execution date and reproducible provenance. IMF AIPI and Oxford Government AI Readiness remain separate because their methods and scales differ.

The map geometry comes from `johan/world.geo.json`, released into the public domain under the UNLICENSE. Boundaries are used solely for analytical visualization and do not express an institutional position on borders or territories.

## Authorship

Intellectual direction, methodology and final approval: César David Rincón Godoy ([ORCID 0009-0003-2112-3851](https://orcid.org/0009-0003-2112-3851)). OpenAI Codex provides disclosed technical assistance in architecture, data engineering, programming, documentation and testing, and is not listed as an academic author.
