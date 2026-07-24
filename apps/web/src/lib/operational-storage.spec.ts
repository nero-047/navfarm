/** @jest-environment node */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const allowedPreferenceKeys = new Set([
  'navfarm_theme',
  'navfarm_lang',
  'navfarm_sidebar_collapsed',
]);

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(path) ? [path] : [];
  });
}

describe('browser storage boundary', () => {
  it('uses localStorage only for allowlisted UI preferences', () => {
    const sourceRoot = join(process.cwd(), 'src');
    const calls = sourceFiles(sourceRoot).flatMap((path) => {
      const source = readFileSync(path, 'utf8');
      return [...source.matchAll(/localStorage\.(?:getItem|setItem|removeItem)\(\s*['"]([^'"]+)['"]/g)]
        .map((match) => ({ path, key: match[1] }));
    });

    expect(calls.length).toBeGreaterThan(0);
    expect(calls.filter(({ key }) => !allowedPreferenceKeys.has(key))).toEqual([]);
  });
});
