import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Ignore successful polling timestamps, but preserve article publication dates,
// source health, errors and every other field so changed evidence remains visible.
export function newsEquivalent(before, after) {
  const semantic = ({ checked_at, sources = [], ...rest }) => ({
    ...rest,
    sources: sources.map(({ last_successful_at, ...source }) => source),
  });
  return JSON.stringify(semantic(before)) === JSON.stringify(semantic(after));
}

// Review branches contain exactly one generated commit on the checked-out base.
// Read the commit object's actual parent rather than traversing history: a
// depth-one checkout intentionally does not have the parent object available.
export function reviewMatchesBase(ref, base, cwd = process.cwd()) {
  const run = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
  const baseOid = run('rev-parse', '--verify', `${base}^{commit}`);
  const headers = run('cat-file', '-p', `${ref}^{commit}`).split('\n\n', 1)[0];
  const parents = headers.split('\n').filter(line => line.startsWith('parent ')).map(line => line.slice(7));
  return parents.length === 1 && parents[0] === baseOid;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [ref, path, base] = process.argv.slice(2);
  const before = JSON.parse(execFileSync('git', ['show', `${ref}:${path}`], { encoding: 'utf8' }));
  const after = JSON.parse(readFileSync(path, 'utf8'));
  console.log(newsEquivalent(before, after) && (!base || reviewMatchesBase(ref, base)));
}
