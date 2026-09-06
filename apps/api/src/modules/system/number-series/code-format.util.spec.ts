import { formatSeriesCode, nextSequence } from './code-format.util';

describe('shared preview/allocation format', () => {
  const series = { prefix: 'PIG', separator: '-', date_format: 'YYYY', seq_length: 4, current_seq: 12, reset_frequency: 'NEVER', updated_at: '2025-12-01' };
  const now = new Date(2026, 8, 6);
  it('uses the configured prefix, date and padding', () => {
    expect(formatSeriesCode(series, nextSequence(series, now), now)).toBe('PIG-2026-0013');
    expect(formatSeriesCode({ ...series, date_format: 'YY', separator: '/' }, 2, now)).toBe('PIG/26/0002');
  });
  it('resets only on the configured period change', () => {
    expect(nextSequence({ ...series, reset_frequency: 'YEARLY' }, now)).toBe(1);
    expect(nextSequence({ ...series, reset_frequency: 'MONTHLY', updated_at: '2026-08-31' }, now)).toBe(1);
    expect(nextSequence({ ...series, reset_frequency: 'MONTHLY', updated_at: '2026-09-01' }, now)).toBe(13);
  });
});
