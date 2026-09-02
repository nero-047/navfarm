import {
  SEEDED_LOB_CODES,
  forSeededLobs,
  SYSTEM_ITEM_SEED,
  SYSTEM_BREED_SEED,
  SYSTEM_PARAMETER_SEED,
} from './system-master-data-seed';

/**
 * Only piggery is in scope. The other fifteen lines of business have rows in
 * lob_master (they are the taxonomy) but seeding their items, breeds and
 * parameters produced master data for screens that do not work — noise in every
 * picker, and a demo that looks broader than it is.
 *
 * The definitions stay in the seed constants so enabling a line of business
 * later is one entry in SEEDED_LOB_CODES, not a re-typing job.
 */
describe('seeded line-of-business scope', () => {
  it('seeds piggery only', () => {
    expect(SEEDED_LOB_CODES).toEqual(['LVS_PIGGERY']);
  });

  it('filters every LOB-scoped seed constant down to what is in scope', () => {
    const inScope: readonly string[] = SEEDED_LOB_CODES;
    const check = (name: string, rows: readonly { lob_code: string }[]) => {
      const kept = forSeededLobs(rows);
      expect({ name, outOfScope: kept.filter((r) => !inScope.includes(r.lob_code)) })
        .toEqual({ name, outOfScope: [] });
      expect({ name, empty: kept.length === 0 }).toEqual({ name, empty: false });
    };

    check('items', SYSTEM_ITEM_SEED);
    check('breeds', SYSTEM_BREED_SEED);
    check('parameters', SYSTEM_PARAMETER_SEED);
  });

  it('keeps the out-of-scope definitions available for later', () => {
    // The point of filtering rather than deleting: the rows are still there.
    const allLobs = new Set(SYSTEM_ITEM_SEED.map((i) => i.lob_code));
    expect(allLobs.size).toBeGreaterThan(1);
  });
});
