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
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [ref, path] = process.argv.slice(2);
  const before = JSON.parse(execFileSync('git', ['show', `${ref}:${path}`], { encoding: 'utf8' }));
  const after = JSON.parse(readFileSync(path, 'utf8'));
  console.log(newsEquivalent(before, after));
}
