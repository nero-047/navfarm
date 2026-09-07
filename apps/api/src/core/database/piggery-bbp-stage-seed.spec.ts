import { SYSTEM_STAGE_SEED, SYSTEM_BREED_LIFECYCLE_SEED } from './system-master-data-seed';
import { DOCUMENTED_REASONS } from './reason-code-seed';

/**
 * The catalog is named by the TDD tracker (row 24) and timed by BBP-1 §1.7.
 * Both halves are asserted here, because the whole point of the split is that
 * changing a name must not quietly change a duration.
 */
describe('piggery master stage catalog', () => {
  it('contains exactly the stages the TDD lists, plus the two the BBP requires', () => {
    expect(SYSTEM_STAGE_SEED.map((s) => s.stage_code).sort()).toEqual([
      // TDD row 24, in its own words.
      'QUARANTINE', 'GILT_GROWER', 'FLUSH', 'DRY_SOW', 'GESTATION', 'FARROWING',
      'WEANING', 'PRODUCTIVE_SOW', 'BOAR_AI', 'CULLED', 'DEAD', 'SOLD', 'SLAUGHTERED',
      // Kept from BBP §1.7: the tracker omits INSEMINATION, but the blueprint
      // specifies it and flush → gestation runs through it; LACTATION is the
      // 28-day period the blueprint costs the sow's nursing against, which
      // WEANING (an event) does not replace.
      'INSEMINATION', 'LACTATION',
    ].sort());
  });

  it('keeps the BBP durations even though the names came from the TDD', () => {
    const duration = (code: string) => SYSTEM_STAGE_SEED.find((s) => s.stage_code === code)?.typical_duration_days;
    expect(duration('GESTATION')).toBe(116);
    expect(duration('GILT_GROWER')).toBe(210); // was GILT_REARING
    expect(duration('LACTATION')).toBe(28);
    expect(duration('QUARANTINE')).toBe(28);
    // Ranges in the BBP stay ranges: no midpoint is invented as a typical day.
    for (const code of ['DRY_SOW', 'FLUSH', 'FARROWING']) expect(duration(code)).toBeUndefined();
  });

  it('gives every disposal state a stage, so status and stage can agree', () => {
    const disposal = SYSTEM_STAGE_SEED.filter((s) => s.stage_category === 'DISPOSAL').map((s) => s.stage_code).sort();
    expect(disposal).toEqual(['CULLED', 'DEAD', 'SOLD', 'SLAUGHTERED'].sort());
  });

  it('keeps transitions, reason restrictions and seeded profiles inside the catalog', () => {
    const codes = SYSTEM_STAGE_SEED.map((s) => s.stage_code);
    for (const s of SYSTEM_STAGE_SEED) if (s.next_stage_code) expect(codes).toContain(s.next_stage_code);
    for (const r of DOCUMENTED_REASONS) for (const code of r.applicable_stages || []) expect(codes).toContain(code);
    for (const row of SYSTEM_BREED_LIFECYCLE_SEED) expect(codes).toContain(row.stage_code);
    expect(SYSTEM_BREED_LIFECYCLE_SEED.filter((s) => s.stage_code === 'GESTATION').every((s) => s.period_to === 116)).toBe(true);
  });
});
