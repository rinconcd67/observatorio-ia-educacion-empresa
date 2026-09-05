# Data policy

## Principles

- The observatory uses public, documented sources.
- Every observation retains its source, period, unit and provenance.
- Missing values are neither imputed nor converted to zero.
- Indexes based on different methodologies remain separate.
- Updates must pass coverage, range, duplicate and variation controls.
- Derived comparisons require the same country and year; observations from different periods are not subtracted.
- Dynamic sources do not use a manually frozen end year, while historical editions remain explicitly pinned.
- SHA-256 fingerprints identify the exact stored or published bytes and declare their scope.

## Publication

The site publishes processed data for consultation and download. Raw files remain outside Git and are subject to provider terms. An automated update creates a candidate version; publication requires validation and human approval.

## Corrections

Corrections are recorded in the changelog. Methodological changes require a new observatory version.
