const POLICY_MODES = new Set([
  "all_available",
  "since_year",
  "open_from",
  "from_year_to_run_year",
  "pinned_edition",
]);

function sourceLabel(source) {
  return source?.id ? `La fuente ${source.id}` : "La fuente";
}

function requiredYear(policy, field, source) {
  const year = policy[field];
  if (!Number.isInteger(year) || year < 1900 || year > 9999) {
    throw new TypeError(`${sourceLabel(source)} requiere time_policy.${field} como año entero válido`);
  }
  return year;
}

function executionYear(asOf) {
  const value = asOf ?? new Date();
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new TypeError("resolveSourceRequest requiere asOf como fecha válida");
  }
  return date.getUTCFullYear();
}

function validateSource(source) {
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    throw new TypeError("resolveSourceRequest requiere una fuente válida");
  }
  if (typeof source.url !== "string" || source.url.length === 0) {
    throw new TypeError(`${sourceLabel(source)} requiere una URL`);
  }
  if (!source.time_policy || typeof source.time_policy !== "object" || Array.isArray(source.time_policy)) {
    throw new TypeError(`${sourceLabel(source)} requiere time_policy explícita`);
  }
  if (!POLICY_MODES.has(source.time_policy.mode)) {
    throw new TypeError(`${sourceLabel(source)} tiene time_policy.mode no admitido: ${source.time_policy.mode}`);
  }
  try {
    return new URL(source.url);
  } catch {
    throw new TypeError(`${sourceLabel(source)} requiere una URL válida`);
  }
}

export function resolveSourceRequest(source, { asOf } = {}) {
  const url = validateSource(source);
  const policy = source.time_policy;
  const runYear = executionYear(asOf);
  let requestedStartYear = null;
  let requestedEndYear = null;

  if (policy.mode === "all_available") {
    url.searchParams.delete("time");
    url.searchParams.delete("sinceTimePeriod");
    url.searchParams.delete("untilTimePeriod");
    url.searchParams.delete("startPeriod");
    url.searchParams.delete("endPeriod");
    url.searchParams.delete("date");
  } else if (policy.mode === "since_year") {
    requestedStartYear = requiredYear(policy, "start_year", source);
    url.searchParams.delete("time");
    url.searchParams.delete("untilTimePeriod");
    url.searchParams.set("sinceTimePeriod", String(requestedStartYear));
  } else if (policy.mode === "open_from") {
    requestedStartYear = requiredYear(policy, "start_year", source);
    url.searchParams.set("startPeriod", String(requestedStartYear));
    url.searchParams.delete("endPeriod");
  } else if (policy.mode === "from_year_to_run_year") {
    requestedStartYear = requiredYear(policy, "start_year", source);
    requestedEndYear = runYear;
    if (requestedStartYear > requestedEndYear) {
      throw new RangeError(
        `${sourceLabel(source)} tiene start_year ${requestedStartYear} posterior al año de ejecución ${requestedEndYear}`,
      );
    }
    url.searchParams.set("date", `${requestedStartYear}:${requestedEndYear}`);
  } else if (policy.mode === "pinned_edition") {
    const editionYear = requiredYear(policy, "edition_year", source);
    requestedStartYear = editionYear;
    requestedEndYear = editionYear;
  }

  return {
    url: url.toString(),
    requested_start_year: requestedStartYear,
    requested_end_year: requestedEndYear,
    policy_mode: policy.mode,
  };
}
