import { computeStageDay } from '../src/components/console/piggery/resolve-piggery-stage';

describe('computeStageDay', () => {
  it('counts from the day the batch entered the stage, not from the batch start', () => {
    // A sow cohort that started in quarantine on 2026-03-06 and entered
    // gestation on 2026-07-01 is on gestation day 63 as at 2026-09-01 — not
    // day 180, and not "114 of 114" after clamping.
    expect(computeStageDay('2026-07-01', 114, '2026-09-01')).toBe(63);
  });

  it('clamps to the standard length once the stage has overrun', () => {
    expect(computeStageDay('2026-01-01', 114, '2026-09-01')).toBe(114);
  });

  it('reports day 1 on the day the stage begins', () => {
    expect(computeStageDay('2026-09-01', 114, '2026-09-01')).toBe(1);
  });

  it('falls back to day 1 without a date', () => {
    expect(computeStageDay(null, 114, '2026-09-01')).toBe(1);
  });
});
