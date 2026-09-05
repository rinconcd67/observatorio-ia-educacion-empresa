export function mean(values) {
  const numbers = values.filter(Number.isFinite);
  if (!numbers.length) return null;
  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

export function round(value, digits = 2) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function quantile(values, probability) {
  const numbers = values.filter(Number.isFinite).sort((left, right) => left - right);
  if (!numbers.length) return null;
  const index = Math.round((numbers.length - 1) * probability);
  return numbers[index];
}

export function latestBy(rows, keyFields) {
  const selected = new Map();
  for (const row of rows) {
    const key = keyFields.map((field) => row[field]).join("|");
    const current = selected.get(key);
    if (!current || Number(row.year) > Number(current.year)) selected.set(key, row);
  }
  return [...selected.values()];
}

export function latestByPriority(rows, keyFields, sourcePriority = {}) {
  const selected = new Map();
  for (const row of rows) {
    const key = keyFields.map((field) => row[field]).join("|");
    const current = selected.get(key);
    const newer = !current || Number(row.year) > Number(current.year);
    const sameYearPreferred = current
      && Number(row.year) === Number(current.year)
      && (sourcePriority[row.source_id] ?? 0) > (sourcePriority[current.source_id] ?? 0);
    if (newer || sameYearPreferred) selected.set(key, row);
  }
  return [...selected.values()];
}

export function latestCommonYearPairs(leftRows, rightRows, keyFields, sourcePriority = {}) {
  const comparisonKeyFields = [...keyFields, "year"];
  const leftByYear = latestByPriority(leftRows, comparisonKeyFields, sourcePriority);
  const rightByYear = new Map(
    latestByPriority(rightRows, comparisonKeyFields, sourcePriority)
      .map((row) => [comparisonKeyFields.map((field) => row[field]).join("|"), row]),
  );

  const commonYearPairs = leftByYear.flatMap((left) => {
    const comparisonKey = comparisonKeyFields.map((field) => left[field]).join("|");
    const right = rightByYear.get(comparisonKey);
    if (!right) return [];
    return [{
      ...Object.fromEntries(keyFields.map((field) => [field, left[field]])),
      year: Number(left.year),
      left,
      right,
    }];
  });

  return latestBy(commonYearPairs, keyFields);
}

export function indexBy(rows, keyField) {
  return new Map(rows.map((row) => [row[keyField], row]));
}
