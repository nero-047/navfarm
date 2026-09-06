/** The preview and the allocator must use the same clock/reset/format rules. */
export interface CodeSeriesFormat {
  prefix: string | null;
  date_format: string | null;
  separator: string | null;
  seq_length: number;
  current_seq: number;
  reset_frequency: string;
  updated_at: string | Date;
}

export function nextSequence(series: CodeSeriesFormat, now: Date): number {
  const previous = new Date(series.updated_at);
  const newYear = now.getFullYear() !== previous.getFullYear();
  const reset = (series.reset_frequency === 'YEARLY' && newYear) ||
    (series.reset_frequency === 'MONTHLY' && (newYear || now.getMonth() !== previous.getMonth()));
  return (reset ? 0 : series.current_seq) + 1;
}

export function formatSeriesCode(series: CodeSeriesFormat, sequence: number, now: Date): string {
  const parts: string[] = [];
  if (series.prefix) parts.push(series.prefix);
  if (series.date_format) {
    const year = String(now.getFullYear());
    parts.push(series.date_format === 'YY' ? year.slice(-2) : year);
  }
  parts.push(String(sequence).padStart(series.seq_length, '0'));
  return parts.join(series.separator || '-');
}
