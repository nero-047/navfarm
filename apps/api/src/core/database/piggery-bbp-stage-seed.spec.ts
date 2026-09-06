import { SYSTEM_STAGE_SEED, SYSTEM_BREED_LIFECYCLE_SEED } from './system-master-data-seed';
import { DOCUMENTED_REASONS } from './reason-code-seed';

describe('BBP §1.7 master stage catalog', () => {
  it('contains exactly the eight named stages', () => {
    expect(SYSTEM_STAGE_SEED.map((s) => s.stage_code).sort()).toEqual(['QUARANTINE', 'GILT_REARING', 'DRY_PERIOD', 'FLUSH', 'INSEMINATION', 'GESTATION', 'FARROWING', 'LACTATION'].sort());
  });
  it('uses 116-day gestation, 210-day gilt rearing, 28-day lactation and quarantine', () => {
    const duration = (code: string) => SYSTEM_STAGE_SEED.find((s) => s.stage_code === code)?.typical_duration_days;
    expect(duration('GESTATION')).toBe(116); expect(duration('GILT_REARING')).toBe(210);
    expect(duration('LACTATION')).toBe(28); expect(duration('QUARANTINE')).toBe(28);
    for (const code of ['DRY_PERIOD', 'FLUSH', 'FARROWING']) expect(duration(code)).toBeUndefined();
  });
  it('keeps transitions, reason restrictions and seeded profiles inside the catalog', () => {
    const codes = SYSTEM_STAGE_SEED.map((s) => s.stage_code);
    for (const s of SYSTEM_STAGE_SEED) if (s.next_stage_code) expect(codes).toContain(s.next_stage_code);
    for (const r of DOCUMENTED_REASONS) for (const code of r.applicable_stages || []) expect(codes).toContain(code);
    for (const row of SYSTEM_BREED_LIFECYCLE_SEED) expect(codes).toContain(row.stage_code);
    expect(SYSTEM_BREED_LIFECYCLE_SEED.filter((s) => s.stage_code === 'GESTATION').every((s) => s.period_to === 116)).toBe(true);
  });
});
