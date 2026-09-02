import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The IAS 41 roll-forward classifies every bio_asset_ledger row by its
 * `entry_type`, and anything it does not recognise falls through to a default
 * that files positive amounts as acquisitions and negative ones as disposals.
 * That default is silent: a misspelled entry type does not error, it just lands
 * in the wrong bucket of a statutory statement.
 *
 * So every entry type any writer produces must be one the report handles.
 */

const MODULES = join(__dirname, '..', '..');
const SRC = join(MODULES, '..');
const read = (path: string) => readFileSync(path, 'utf8');

/** `case 'X':` labels in the roll-forward's classifier. */
function handledByReport(): Set<string> {
  const source = read(join(__dirname, 'financial-reports.service.ts'));
  return new Set([...source.matchAll(/case '([A-Z_]+)':/g)].map((m) => m[1]));
}

/** `entry_type: 'X'` literals written anywhere that writes the ledger. */
function writtenBy(path: string): Set<string> {
  const source = read(path);
  return new Set([...source.matchAll(/entry_type: '([A-Z_]+)'/g)].map((m) => m[1]));
}

const WRITERS = [
  join(MODULES, 'production/batch/batch.service.ts'),
  join(MODULES, 'piggery/animal/animal.service.ts'),
  join(SRC, 'scripts/seed-demo-gaps.ts'),
];

describe('bio-asset ledger entry types', () => {
  it('is classified by the roll-forward, whoever writes it', () => {
    const handled = handledByReport();
    const unhandled: Array<{ writer: string; entryType: string }> = [];

    for (const writer of WRITERS) {
      for (const entryType of writtenBy(writer)) {
        if (!handled.has(entryType)) unhandled.push({ writer: writer.replace(SRC, 'src'), entryType });
      }
    }

    expect(unhandled).toEqual([]);
  });
});
