import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { resolveSourceRequest } from "../src/lib/temporal-policy.mjs";

const activeConfig = JSON.parse(
  await readFile(new URL("../config/active_sources.json", import.meta.url), "utf8"),
);
const controlledConfig = JSON.parse(
  await readFile(new URL("../config/controlled_downloads.json", import.meta.url), "utf8"),
);

const sourcesById = new Map(activeConfig.sources.map((source) => [source.id, source]));
const controlledById = new Map(controlledConfig.sources.map((source) => [source.id, source]));

const expectedDynamicPolicies = new Map([
  ["eurostat_enterprise_ai", "all_available"],
  ["eurostat_formal_education_ai", "since_year"],
  ["eurostat_student_ai", "since_year"],
  ["oecd_ict_businesses", "open_from"],
  ["oecd_individual_genai", "open_from"],
  ["world_bank_internet", "from_year_to_run_year"],
  ["world_bank_tertiary", "from_year_to_run_year"],
  ["world_bank_gdp_per_capita", "from_year_to_run_year"],
]);

function policyMode(source) {
  return typeof source?.time_policy === "string"
    ? source.time_policy
    : source?.time_policy?.mode;
}

function policyYear(source, field) {
  return source?.time_policy?.[field] ?? source?.time_policy?.year;
}

function source(id) {
  const value = sourcesById.get(id);
  assert.ok(value, `La fuente dinámica ${id} debe existir en config/active_sources.json`);
  return value;
}

function controlledSource(id) {
  const value = controlledById.get(id);
  assert.ok(value, `La fuente controlada ${id} debe existir en config/controlled_downloads.json`);
  return value;
}

test("las fuentes temporales activas declaran una política explícita", () => {
  const missing = [...expectedDynamicPolicies.keys()].filter((id) => !policyMode(source(id)));
  assert.deepEqual(
    missing,
    [],
    `Falta time_policy en fuentes dinámicas: ${missing.join(", ")}. `
      + "La ventana temporal no puede quedar implícita en la URL.",
  );

  for (const [id, expectedMode] of expectedDynamicPolicies) {
    assert.equal(
      policyMode(source(id)),
      expectedMode,
      `${id}: time_policy.mode debe ser ${expectedMode}`,
    );
  }
});

test("Eurostat educación y estudiantes quedan abiertos a años futuros", () => {
  for (const id of ["eurostat_formal_education_ai", "eurostat_student_ai"]) {
    const item = source(id);
    assert.equal(policyMode(item), "since_year", `${id}: debe declarar time_policy.mode=since_year`);
    assert.equal(policyYear(item, "start_year"), 2025, `${id}: la serie debe comenzar en 2025`);

    const request = resolveSourceRequest(item, { asOf: "2027-06-15T00:00:00.000Z" });
    const resolved = new URL(request.url);
    assert.equal(request.policy_mode, "since_year");
    assert.equal(request.requested_start_year, 2025);
    assert.equal(request.requested_end_year, null);
    assert.equal(resolved.searchParams.get("sinceTimePeriod"), "2025");
    assert.equal(resolved.searchParams.has("time"), false, `${id}: no debe conservar time=2025`);
    assert.equal(
      resolved.searchParams.has("untilTimePeriod"),
      false,
      `${id}: no debe fijar un año final`,
    );
  }
});

test("Banco Mundial resuelve el límite superior con el año de ejecución inyectado", () => {
  const asOf = "2027-03-01T12:00:00.000Z";
  for (const id of ["world_bank_internet", "world_bank_tertiary", "world_bank_gdp_per_capita"]) {
    const item = source(id);
    assert.equal(
      policyMode(item),
      "from_year_to_run_year",
      `${id}: debe declarar time_policy.mode=from_year_to_run_year`,
    );
    assert.equal(policyYear(item, "start_year"), 2020, `${id}: la ventana debe comenzar en 2020`);
    const request = resolveSourceRequest(item, { asOf });
    assert.equal(request.policy_mode, "from_year_to_run_year");
    assert.equal(request.requested_start_year, 2020);
    assert.equal(request.requested_end_year, 2027);
    assert.equal(new URL(request.url).searchParams.get("date"), "2020:2027");
  }
});

test("OECD conserva ventanas abiertas desde su año inicial", () => {
  const expectations = new Map([
    ["oecd_ict_businesses", 2023],
    ["oecd_individual_genai", 2025],
  ]);

  for (const [id, startYear] of expectations) {
    const item = source(id);
    const url = new URL(item.url);
    assert.equal(policyMode(item), "open_from", `${id}: debe declarar time_policy.mode=open_from`);
    assert.equal(policyYear(item, "start_year"), startYear, `${id}: start_year debe ser ${startYear}`);
    assert.equal(url.searchParams.get("startPeriod"), String(startYear));
    assert.equal(url.searchParams.has("endPeriod"), false, `${id}: startPeriod sin endPeriod es válido`);
    const request = resolveSourceRequest(item, { asOf: "2027-01-01T00:00:00.000Z" });
    assert.equal(request.requested_start_year, startYear);
    assert.equal(request.requested_end_year, null);
    assert.equal(new URL(request.url).searchParams.has("endPeriod"), false);
  }
});

test("las fuentes dinámicas no contienen un año final literal en sus URL base", () => {
  const frozen = [];
  for (const id of expectedDynamicPolicies.keys()) {
    const item = source(id);
    const url = new URL(item.url);
    const exactEurostatYear = url.searchParams.get("time");
    const eurostatEnd = url.searchParams.get("untilTimePeriod");
    const oecdEnd = url.searchParams.get("endPeriod");
    const worldBankRange = url.searchParams.get("date");
    if (exactEurostatYear || eurostatEnd || oecdEnd || /^\d{4}:\d{4}$/.test(worldBankRange ?? "")) {
      frozen.push(id);
    }
  }

  assert.deepEqual(
    frozen,
    [],
    `Las URL base contienen ventanas finales congeladas: ${frozen.join(", ")}. `
      + "El límite superior debe resolverse desde time_policy durante la ejecución.",
  );
});

test("AIPI y Oxford se distinguen como ediciones fijadas, no como fuentes dinámicas", () => {
  const expectations = new Map([
    ["imf_aipi", 2023],
    ["oxford_government_ai_readiness_2025", 2025],
  ]);

  for (const [id, editionYear] of expectations) {
    const item = controlledSource(id);
    assert.equal(
      policyMode(item),
      "pinned_edition",
      `${id}: debe declarar time_policy.mode=pinned_edition para no confundirse con una ventana dinámica`,
    );
    assert.equal(
      policyYear(item, "edition_year"),
      editionYear,
      `${id}: debe declarar edition_year=${editionYear} dentro de time_policy`,
    );
    const request = resolveSourceRequest(item, { asOf: "2027-01-01T00:00:00.000Z" });
    assert.equal(request.policy_mode, "pinned_edition");
    assert.equal(request.requested_start_year, editionYear);
    assert.equal(request.requested_end_year, editionYear);
  }
});

test("all_available conserva la URL sin límites temporales", () => {
  const request = resolveSourceRequest(source("eurostat_enterprise_ai"), {
    asOf: "2027-01-01T00:00:00.000Z",
  });
  const url = new URL(request.url);
  assert.equal(request.policy_mode, "all_available");
  assert.equal(request.requested_start_year, null);
  assert.equal(request.requested_end_year, null);
  assert.equal(url.searchParams.has("time"), false);
  assert.equal(url.searchParams.has("untilTimePeriod"), false);
});

test("rechaza políticas temporales ausentes, desconocidas o incoherentes", () => {
  const base = { id: "test_source", url: "https://example.test/data" };
  assert.throws(
    () => resolveSourceRequest(base, { asOf: "2027-01-01T00:00:00.000Z" }),
    /requiere time_policy explícita/,
  );
  assert.throws(
    () => resolveSourceRequest(
      { ...base, time_policy: { mode: "latest_guess" } },
      { asOf: "2027-01-01T00:00:00.000Z" },
    ),
    /mode no admitido/,
  );
  assert.throws(
    () => resolveSourceRequest(
      { ...base, time_policy: { mode: "since_year", start_year: "2025" } },
      { asOf: "2027-01-01T00:00:00.000Z" },
    ),
    /start_year como año entero válido/,
  );
  assert.throws(
    () => resolveSourceRequest(
      { ...base, time_policy: { mode: "from_year_to_run_year", start_year: 2028 } },
      { asOf: "2027-01-01T00:00:00.000Z" },
    ),
    /posterior al año de ejecución 2027/,
  );
  assert.throws(
    () => resolveSourceRequest(
      { ...base, time_policy: { mode: "all_available" } },
      { asOf: "fecha-inválida" },
    ),
    /asOf como fecha válida/,
  );
});
