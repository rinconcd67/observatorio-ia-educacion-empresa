# Global AI Observatory for Education and Business

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.24140002.svg)](https://doi.org/10.5281/zenodo.24140002)

[Español](README.es.md) | **English**

A reproducible, bilingual system for monitoring artificial intelligence preparedness, adoption and use in education, business and government by country and region.

## Candidate version 0.5.0

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
- Business-education comparisons use the latest common year and report an explicit status when no comparable period exists.
- Dynamic temporal windows and SHA-256 fingerprints of the exact stored and published bytes.

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

## Technical closure records

- [Complete v0.4.0 technical log (Spanish)](docs/BITACORA_TECNICA_CIERRE_V0.4.0.md)
- [Internal publication certificate (Spanish)](docs/CERTIFICACION_PUBLICACION_V0.4.0.md)
- [Structured evidence manifest](docs/evidence/publication-v0.4.0.json)

The map geometry comes from `johan/world.geo.json`, released into the public domain under the UNLICENSE. Boundaries are used solely for analytical visualization and do not express an institutional position on borders or territories.

## Authorship and Scientific Governance

- **Principal Investigator & Academic Lead (PI):** César David Rincón Godoy ([ORCID: 0009-0003-2112-3851](https://orcid.org/0009-0003-2112-3851) | [Google Scholar](https://scholar.google.com/citations?user=jwtoI84AAAAJ)).
- **Governance & R&D Framework:** See [GOVERNANCE.en.md](GOVERNANCE.en.md) for research tracks, technology partnerships (Google Research / Cloud), and open-science intellectual property terms.
- **Citation & Scholarly Metadata:** See [CITATION.cff](CITATION.cff) or [AUTHORS.en.md](AUTHORS.en.md) to cite this repository in academic works.
- **AI-Assisted Technical Support:** OpenAI Codex and Google Antigravity provide technical and engineering assistance in architecture, data engineering, pipelines, and testing under the author's supervision, and are not listed as academic authors.
