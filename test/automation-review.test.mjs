import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const pr = { number: 61, headRefOid: 'current', url: 'https://example.test/pr/61' };
const success = { databaseId: 123, headSha: 'current', status: 'completed', conclusion: 'success', url: 'https://example.test/run/123' };
const validDetail = { event: 'pull_request', headSha: 'current', status: 'completed', conclusion: 'success', jobs: [{ name: 'validate', status: 'completed', conclusion: 'success' }] };
function runReview(proposal, runs, { detail = validDetail, finalPr = proposal, attempts = 1, requirePr = false, nextRuns = runs } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'observatory-review-'));
  try {
    // Reject mutations and every command not explicitly needed for read-only observation.
    writeFileSync(join(dir, 'gh'), `#!/bin/sh
case "$1 $2" in
  'pr list')
    if [ -f "$MOCK_DIR/pr-read" ]; then printf '%s' "$MOCK_FINAL_PR"; else touch "$MOCK_DIR/pr-read"; printf '%s' "$MOCK_PR"; fi ;;
  'run list')
    if [ -f "$MOCK_DIR/run-read" ]; then printf '%s' "$MOCK_NEXT_RUNS"; else touch "$MOCK_DIR/run-read"; printf '%s' "$MOCK_RUNS"; fi ;;
  'run view') printf '%s' "$MOCK_DETAIL" ;;
  *) exit 99 ;;
esac
`, { mode: 0o755 });
    const summary = join(dir, 'summary.md');
    const result = spawnSync('bash', [resolve('.github/scripts/check-pr-review.sh')], {
      encoding: 'utf8',
      env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, REVIEW_BRANCH: 'automation/news-review', GITHUB_STEP_SUMMARY: summary, PR_CI_MAX_ATTEMPTS: String(attempts), PR_CI_POLL_SECONDS: '0', REQUIRE_PR: String(requirePr), MOCK_DIR: dir, MOCK_PR: JSON.stringify(proposal), MOCK_FINAL_PR: JSON.stringify(finalPr), MOCK_RUNS: JSON.stringify(runs), MOCK_NEXT_RUNS: JSON.stringify(nextRuns), MOCK_DETAIL: JSON.stringify(detail) },
    });
    return { status: result.status, summary: readFileSync(summary, 'utf8') };
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
test('reports action_required on current PR head, even with other synthetic successes', () => {
  const result = runReview(pr, [{ ...success, conclusion: 'action_required' }]);
  assert.equal(result.status, 1);
  assert.match(result.summary, /Intervención humana requerida/);
});
test('old head evidence does not certify a new head', () => {
  const result = runReview(pr, [{ ...success, headSha: 'old' }]);
  assert.equal(result.status, 1);
  assert.match(result.summary, /SIN_EJECUCION/);
});
test('no proposal is distinct from successful validation and can be required', () => {
  assert.equal(runReview(null, []).status, 0);
  assert.match(runReview(null, []).summary, /SIN_PR/);
  assert.equal(runReview(null, [], { requirePr: true }).status, 1);
});
test('newer native success supersedes older approval block on the same head', () => {
  const result = runReview(pr, [success, { ...success, conclusion: 'action_required' }]);
  assert.equal(result.status, 0);
  assert.match(result.summary, /CI_NATIVO_APROBADO/);
  assert.match(result.summary, /no confirma que sea fusionable/);
});
test('pending CI is observed to completion without changing checks', () => {
  const result = runReview(pr, [{ ...success, status: 'queued', conclusion: null }], { attempts: 2, nextRuns: [success] });
  assert.equal(result.status, 0);
});
test('queue timeout is not mislabeled as failed tests', () => {
  const result = runReview(pr, [{ ...success, status: 'queued', conclusion: null }]);
  assert.equal(result.status, 1);
  assert.match(result.summary, /PENDIENTE_queued/);
  assert.match(result.summary, /no equivale a pruebas fallidas/);
});
test('native failure, cancellation and timeout remain failures', () => {
  for (const conclusion of ['failure', 'cancelled', 'timed_out', 'skipped']) {
    const result = runReview(pr, [{ ...success, conclusion }]);
    assert.equal(result.status, 1);
    assert.match(result.summary, new RegExp(`CI_TERMINADO_${conclusion}`));
  }
});
test('run success requires the native validate job, event and exact SHA', () => {
  for (const detail of [
    { ...validDetail, event: 'workflow_dispatch' },
    { ...validDetail, headSha: 'old' },
    { ...validDetail, jobs: [] },
    { ...validDetail, jobs: [{ name: 'validate', status: 'completed', conclusion: 'skipped' }] },
  ]) {
    const result = runReview(pr, [success], { detail });
    assert.equal(result.status, 1);
    assert.match(result.summary, /SIN_VALIDATE_NATIVO/);
  }
});
test('concurrent head changes and closed PRs invalidate observed success', () => {
  for (const finalPr of [null, { ...pr, headRefOid: 'changed' }, { ...pr, number: 62 }]) {
    const result = runReview(pr, [success], { finalPr });
    assert.equal(result.status, 1);
    assert.match(result.summary, /PR_CAMBIO/);
  }
});
