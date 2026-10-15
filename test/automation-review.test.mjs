import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

function runReview(pr, runs) {
  const dir = mkdtempSync(join(tmpdir(), 'observatory-review-'));
  try {
    // The stub rejects every invocation except the two read-only commands used by the guard.
    writeFileSync(join(dir, 'gh'), `#!/bin/sh\ncase "$1 $2" in\n  'pr list') printf '%s' "$MOCK_PR" ;;\n  'run list') printf '%s' "$MOCK_RUNS" ;;\n  *) exit 99 ;;\nesac\n`, { mode: 0o755 });
    const summary = join(dir, 'summary.md');
    const result = spawnSync('bash', [resolve('.github/scripts/check-pr-review.sh')], {
      encoding: 'utf8',
      env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, REVIEW_BRANCH: 'automation/news-review', GITHUB_STEP_SUMMARY: summary, MOCK_PR: JSON.stringify(pr), MOCK_RUNS: JSON.stringify(runs) },
    });
    return { status: result.status, summary: readFileSync(summary, 'utf8') };
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
const pr = { number: 61, headRefOid: 'current', url: 'https://example.test/pr/61' };
test('reports action_required on the current PR head instead of claiming success', () => {
  const result = runReview(pr, [{ headSha: 'current', conclusion: 'action_required', url: 'https://example.test/run/1' }]);
  assert.equal(result.status, 1);
  assert.match(result.summary, /Intervención humana requerida/);
  assert.match(result.summary, /https:\/\/example.test\/run\/1/);
});
test('ignores an approval block belonging to an older PR head', () => {
  const result = runReview(pr, [{ headSha: 'old', conclusion: 'action_required', url: 'https://example.test/run/old' }]);
  assert.equal(result.status, 0);
  assert.match(result.summary, /no confirma que sea fusionable/);
});
test('a refresh with no open proposal exits without an approval assertion', () => {
  const result = runReview(null, []);
  assert.equal(result.status, 0);
  assert.match(result.summary, /No hay propuesta abierta/);
});

test('a newer successful PR run supersedes an older block on the same head', () => {
  const result = runReview(pr, [
    { headSha: 'current', conclusion: 'success', url: 'https://example.test/run/new' },
    { headSha: 'current', conclusion: 'action_required', url: 'https://example.test/run/old' },
  ]);
  assert.equal(result.status, 0);
});
