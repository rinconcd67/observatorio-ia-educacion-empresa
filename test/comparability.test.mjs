import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createArtifact } from "../src/build-artifact.mjs";

const artifactUrl = new URL("../dashboard/artifact.json", import.meta.url);
const artifact = JSON.parse(await readFile(artifactUrl, "utf8"));
const { country_profile: countryProfiles, gap_analysis: gapAnalysis } = artifact.snapshot.datasets;

function mismatchedSwitzerlandArtifact() {
  return createArtifact({
    generated_at: "2026-08-10T12:00:00.000Z",
    status: "ready",
    countries: [{
      iso3: "CHE",
      iso2: "CH",
      country: "Switzerland",
      region: "Europe & Central Asia",
      income_group: "High income",
    }],
    observations: [
      {
        iso3: "CHE",
        year: 2023,
        metric_id: "enterprise_ai_adoption",
        value: 9.94986452932108,
        source_id: "oecd_ict_businesses",
      },
      {
        iso3: "CHE",
        year: 2025,
        metric_id: "formal_education_genai_use",
        value: 20.69,
        source_id: "eurostat_formal_education_ai",
      },
    ],
    source_runs: [],
    healthy_sources_count: 0,
  });
}

test("toda brecha de adopción publicada compara empresa y educación en el mismo año", () => {
  const nonComparableGaps = countryProfiles
    .filter((row) => Number.isFinite(row.adoption_gap_pp))
    .filter((row) => (
      row.adoption_gap_status !== "comparable_same_year"
      || !Number.isInteger(row.adoption_gap_year)
      || !Number.isFinite(row.adoption_gap_business_pct)
      || !Number.isFinite(row.adoption_gap_education_pct)
      || typeof row.adoption_gap_business_source_id !== "string"
      || typeof row.adoption_gap_education_source_id !== "string"
      || row.adoption_gap_pp !== Math.round(
        (row.adoption_gap_business_pct - row.adoption_gap_education_pct) * 100,
      ) / 100
    ))
    .map((row) => ({
      iso3: row.iso3,
      adoption_gap_year: row.adoption_gap_year,
      adoption_gap_status: row.adoption_gap_status,
      adoption_gap_pp: row.adoption_gap_pp,
    }));

  assert.deepEqual(nonComparableGaps, []);
});

test("Suiza no publica una brecha al combinar empresa 2023 con educación 2025", () => {
  const switzerland = mismatchedSwitzerlandArtifact().snapshot.datasets.country_profile[0];

  assert.ok(switzerland, "El perfil de Suiza debe existir");
  assert.equal(switzerland.business_year, 2023);
  assert.equal(switzerland.education_year, 2025);
  assert.equal(switzerland.adoption_gap_pp, null);
  assert.equal(switzerland.adoption_gap_year, null);
  assert.equal(switzerland.adoption_gap_business_pct, null);
  assert.equal(switzerland.adoption_gap_education_pct, null);
  assert.equal(switzerland.adoption_gap_business_source_id, null);
  assert.equal(switzerland.adoption_gap_education_source_id, null);
  assert.equal(switzerland.adoption_gap_status, "no_common_year");
});

test("Suiza conserva sus últimos valores individuales aunque la brecha no sea comparable", () => {
  const switzerland = mismatchedSwitzerlandArtifact().snapshot.datasets.country_profile[0];

  assert.ok(switzerland, "El perfil de Suiza debe existir");
  assert.equal(switzerland.business_ai_pct, 9.94986452932108);
  assert.equal(switzerland.business_year, 2023);
  assert.equal(switzerland.formal_education_ai_pct, 20.69);
  assert.equal(switzerland.education_year, 2025);
});

test("gap_analysis contiene exclusivamente países con años comparables", () => {
  const nonComparableRows = gapAnalysis
    .filter((row) => (
      row.adoption_gap_status !== "comparable_same_year"
      || !Number.isInteger(row.adoption_gap_year)
    ))
    .map((row) => row.iso3);

  assert.deepEqual(nonComparableRows, []);
  assert.ok(gapAnalysis.every((row) => row.adoption_gap_status === "comparable_same_year"));
  assert.ok(gapAnalysis.every((row) => Number.isFinite(row.adoption_gap_business_pct)));
  assert.ok(gapAnalysis.every((row) => Number.isFinite(row.adoption_gap_education_pct)));
});

test("cada perfil declara el estado de comparabilidad que corresponde a su cobertura", () => {
  for (const row of countryProfiles) {
    const hasBusiness = Number.isFinite(row.business_ai_pct);
    const hasEducation = Number.isFinite(row.formal_education_ai_pct);
    const expectedStatus = Number.isFinite(row.adoption_gap_pp)
      ? "comparable_same_year"
      : !hasBusiness && !hasEducation
        ? "missing_both"
        : !hasBusiness
          ? "missing_business"
          : !hasEducation
            ? "missing_education"
            : "no_common_year";

    assert.equal(row.adoption_gap_status, expectedStatus, row.iso3);
  }
});

test("el resumen cuenta exclusivamente las parejas del mismo año", () => {
  const summary = artifact.snapshot.datasets.summary[0];

  assert.equal(summary.same_year_overlap_countries, gapAnalysis.length);
  assert.equal(summary.overlap_countries, gapAnalysis.length);
});
