import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { newsEquivalent } from '../.github/scripts/news-equivalent.mjs';

const sample = { checked_at: 'before', items: [{ title: 'A', url: 'https://example.test/a', published_at: '2026-10-01' }], sources: [{ name: 'Official', status: 'ok', last_successful_at: 'before' }] };
test('news polling timestamps alone do not create another proposal', () => {
  const next = structuredClone(sample);
  next.checked_at = 'after'; next.sources[0].last_successful_at = 'after';
  assert.equal(newsEquivalent(sample, next), true);
});
test('article updates and source deterioration remain substantive', () => {
  const article = structuredClone(sample); article.items[0].published_at = '2026-10-02';
  assert.equal(newsEquivalent(sample, article), false);
  const source = structuredClone(sample); source.sources[0].status = 'stale';
  assert.equal(newsEquivalent(sample, source), false);
});
test('explicit lease updates an existing remote branch without tracking refs and rejects a concurrent update', () => {
  const dir = mkdtempSync(join(tmpdir(), 'observatory-lease-fixture-'));
  const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const pushScript = resolve('.github/scripts/push-review-branch.sh');
  try {
    const remote = join(dir, 'remote.git'); const local = join(dir, 'local');
    git(dir, 'init', '--bare', remote); git(dir, 'init', local);
    git(local, 'config', 'user.name', 'Test Fixture'); git(local, 'config', 'user.email', 'test@example.invalid');
    git(local, 'remote', 'add', 'origin', remote);
    const commit = value => { writeFileSync(join(local, 'fixture'), value); git(local, 'add', 'fixture'); git(local, 'commit', '-m', 'fixture'); return git(local, 'rev-parse', 'HEAD'); };
    const first = commit('first');
    const push = expected => spawnSync('bash', [pushScript, 'automation/news-review', expected], { cwd: local, encoding: 'utf8' });
    assert.equal(push('').status, 0, 'create only when remote branch absent');
    git(local, 'update-ref', '-d', 'refs/remotes/origin/automation/news-review');
    commit('second');
    assert.equal(push(first).status, 0, 'existing branch updates without a tracking ref');
    const second = git(local, 'rev-parse', 'HEAD');
    commit('third');
    assert.notEqual(push(first).status, 0, 'stale expected remote head is rejected');
    assert.equal(git(remote, 'rev-parse', 'refs/heads/automation/news-review'), second);
    assert.notEqual(push('').status, 0, 'concurrent branch creation is rejected');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
