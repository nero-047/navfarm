"use client";

// Shared "scope this row to specific animals" picker (search + multi-select
// checklist) and the even-split helper it implies — reused across the
// operational batch data entry and stage-wise consumption panels wherever a
// feed/medicine/mortality row can be attributed to specific animals in a
// batch instead of the whole batch.

import { useLanguage } from "@/hooks/useLanguage";

export interface AnimalOption {
  animal_id: string;
  label: string;
}

// batch_transaction.remarks is varchar(500) — truncate defensively before
// posting so a long/compounded string (e.g. a reloaded row re-saved several
// times) fails soft instead of crashing the whole save with a DB error.
export function truncateRemarks(s: string, max = 480): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

// Splits `total` into `n` shares that sum back to exactly `total` (matching
// batch_transaction.quantity's 4-decimal precision) — any rounding remainder
// is absorbed into the last share.
export function splitEvenly(total: number, n: number): number[] {
  const base = Math.floor((total / n) * 10000) / 10000;
  const shares = new Array(n).fill(base);
  const remainder = Math.round((total - base * n) * 10000) / 10000;
  shares[n - 1] = Math.round((shares[n - 1] + remainder) * 10000) / 10000;
  return shares;
}

export function AnimalMultiSelect({
  options,
  loading,
  selected,
  onToggle,
  search,
  onSearchChange,
  selectionNote,
}: {
  options: AnimalOption[];
  loading: boolean;
  selected: Set<string>;
  onToggle: (animalId: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  /** Overrides the default "splits the quantity evenly" footnote — the transfer
      picker selects animals to move, nothing is being split. */
  selectionNote?: string;
}) {
  const { t } = useLanguage();
  const filtered = search.trim()
    ? options.filter((a) => a.label.toLowerCase().includes(search.trim().toLowerCase()))
    : options;

  if (loading) {
    return <p className="text-[11px] text-[var(--text-muted)]">{t("amsLoadingAnimals")}</p>;
  }
  if (options.length === 0) {
    return <p className="text-[11px] text-[var(--text-muted)]">{t("amsNoAnimalsInBatch")}</p>;
  }
  return (
    <div className="space-y-1.5">
      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={t("amsSearchPlaceholder")}
        className="nf-input w-full text-xs"
      />
      <div className="max-h-40 overflow-y-auto rounded-[var(--radius-xs)] border border-[var(--border)]">
        {filtered.length === 0 ? (
          <p className="px-3 py-2 text-[11px] text-[var(--text-muted)]">{t("amsNoMatches")}</p>
        ) : (
          filtered.map((a) => (
            <label key={a.animal_id} className="flex cursor-pointer items-center gap-2 border-b border-[var(--border)] px-3 py-1.5 last:border-b-0">
              <input
                type="checkbox"
                checked={selected.has(a.animal_id)}
                onChange={() => onToggle(a.animal_id)}
                className="h-3.5 w-3.5 rounded-[var(--radius-xs)] accent-(--accent)"
              />
              <span className="font-mono font-semibold text-[var(--accent)]">{a.label}</span>
            </label>
          ))
        )}
      </div>
      {selected.size > 0 && (
        <p className="text-[11px] text-[var(--text-muted)]">{selectionNote ?? t("amsSelectedNote", { n: String(selected.size) })}</p>
      )}
    </div>
  );
}
