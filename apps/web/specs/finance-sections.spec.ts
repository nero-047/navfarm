import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * A finance report is only reachable if three things agree: the sub-nav lists
 * it, the route file exists, and the shell knows its title. A find-and-replace
 * once rewrote a nav href and silently orphaned a page, so this checks all
 * three rather than trusting any one of them.
 */
const shellSource = readFileSync(
  join(__dirname, '../src/components/console/finance/finance-page-shell.tsx'),
  'utf8',
);

const SECTION_RE = /\{ key: "([a-z-]+)", href: "([^"]+)", labelKey: "([A-Za-z]+)" \}/g;

function sections() {
  return [...shellSource.matchAll(SECTION_RE)].map(([, key, href, labelKey]) => ({ key, href, labelKey }));
}

describe('Finance sections', () => {
  it('lists every report the module ships', () => {
    const keys = sections().map((s) => s.key);
    expect(keys).toEqual([
      'journal',
      'profit-loss',
      'balance-sheet',
      'trial-balance',
      'bio-asset-reconciliation',
      'batch-cost-variance',
    ]);
  });

  it('points each section at a route that exists', () => {
    for (const section of sections()) {
      const segment = section.href.replace(/^\/finance\/?/, '');
      const page = join(__dirname, '../src/app/(app)/finance', segment, 'page.tsx');
      expect({ href: section.href, exists: readFileSync(page, 'utf8').length > 0 }).toEqual({
        href: section.href,
        exists: true,
      });
    }
  });

  it('gives every section a title branch in the shell', () => {
    for (const section of sections()) {
      // Either an explicit branch, or the final fallback (bio-asset).
      const hasBranch =
        shellSource.includes(`activeKey === "${section.key}" ?`) ||
        section.key === 'bio-asset-reconciliation';
      expect({ key: section.key, hasBranch }).toEqual({ key: section.key, hasBranch: true });
    }
  });

  it('keeps the batch cost variance route in the module, not orphaned at the root', () => {
    const variance = sections().find((s) => s.key === 'batch-cost-variance');
    expect(variance?.href).toBe('/finance/batch-cost-variance');
  });
});
