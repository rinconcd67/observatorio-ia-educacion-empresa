import { sha256Bytes } from "./io.mjs";

export const OBSERVATION_DIGEST_SCOPE = "sorted_iso3_metric_id_year_value_v1";

// Empty, malformed or duplicate observations cannot certify a pinned edition.
export function observationDigest(observations) {
  if (!Array.isArray(observations) || observations.length === 0) return null;
  const keys = new Set();
  const rows = [];
  for (const row of observations) {
    if (typeof row.iso3 !== "string" || !row.iso3.trim()
      || typeof row.metric_id !== "string" || !row.metric_id.trim()
      || !Number.isInteger(row.year) || !Number.isFinite(row.value)) return null;
    const key = JSON.stringify([row.iso3, row.metric_id, row.year]);
    if (keys.has(key)) return null;
    keys.add(key);
    rows.push(JSON.stringify([row.iso3, row.metric_id, row.year, row.value]));
  }
  rows.sort();
  return sha256Bytes(`[${rows.join(",")}]`);
}
