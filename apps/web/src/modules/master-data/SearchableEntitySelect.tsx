"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Search } from "lucide-react";
import { Popover, usePopoverSurface } from "@/components/ui/popover";

type Row = Record<string, any>;

/**
 * The panel content of a searchable select. Split out from the trigger/anchor
 * so it can call `usePopoverSurface()` — it only exists (and only mounts) while
 * the popover is open, so its own state (the query, the highlighted row) is
 * naturally fresh on every opening without an extra reset effect.
 */
function SearchableEntityPanel({
  options,
  valueKey,
  getLabel,
  value,
  onPick,
  searchPlaceholder,
  noMatchesLabel,
  ariaLabel,
}: {
  options: Row[];
  valueKey: string;
  getLabel: (row: Row) => string;
  value: string;
  onPick: (row: Row) => void;
  searchPlaceholder: string;
  noMatchesLabel: string;
  ariaLabel: string;
}) {
  const { close } = usePopoverSurface();
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus({ preventScroll: true }); }, []);
  useEffect(() => { setHighlight(0); }, [query]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => getLabel(o).toLowerCase().includes(q));
  }, [options, query, getLabel]);

  function pick(row: Row) {
    onPick(row);
    close();
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (filtered[highlight]) pick(filtered[highlight]);
    }
  }

  return (
    <div className="flex w-full flex-col gap-1">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded
          aria-label={ariaLabel}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={searchPlaceholder}
          className="nf-input-sm w-full"
          style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--input-border)", paddingLeft: "1.75rem" }}
        />
      </div>
      <div role="listbox" aria-label={ariaLabel} className="flex flex-col overflow-y-auto" style={{ maxHeight: "240px" }}>
        {filtered.length === 0 && (
          <div className="px-2 py-2 text-xs" style={{ color: "var(--text-muted)" }}>{noMatchesLabel}</div>
        )}
        {filtered.map((o, idx) => {
          const v = String(o[valueKey]);
          const isSelected = v === String(value);
          return (
            <button
              key={v}
              type="button"
              role="option"
              aria-selected={isSelected}
              onMouseEnter={() => setHighlight(idx)}
              onClick={() => pick(o)}
              className="truncate rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-sm"
              style={{
                backgroundColor: idx === highlight ? "var(--surface-secondary)" : "transparent",
                color: "var(--text-primary)",
                fontWeight: isSelected ? 600 : 400,
              }}
            >
              {getLabel(o)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export interface SearchableEntitySelectProps {
  id?: string;
  ariaLabel: string;
  ariaRequired?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: Row[];
  valueKey: string;
  getLabel: (row: Row) => string;
  disabled?: boolean;
  placeholder: string;
  searchPlaceholder: string;
  noMatchesLabel: string;
}

/** A single-select entity dropdown with an in-panel text filter, for catalogs long enough that
 * scrolling a native `<select>` stops being usable. Built on the shared `Popover` primitive so
 * open/close, outside-click and Escape all match every other overlay in the app. */
export function SearchableEntitySelect({
  id,
  ariaLabel,
  ariaRequired,
  value,
  onChange,
  options,
  valueKey,
  getLabel,
  disabled,
  placeholder,
  searchPlaceholder,
  noMatchesLabel,
}: SearchableEntitySelectProps) {
  const [open, setOpen] = useState(false);
  // A field can go from enabled to disabled mid-interaction (e.g. its restrictOptionsBy
  // selector changes while this panel is open) — force it closed rather than leave an open
  // panel over a now-disabled trigger.
  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);

  const selected = options.find((o) => String(o[valueKey]) === String(value));

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      align="start"
      haspopup="listbox"
      className="w-full"
      panelClassName="nf-combobox-panel"
      trigger={(triggerProps) => (
        <button
          {...triggerProps}
          id={id}
          aria-label={ariaLabel}
          aria-required={ariaRequired}
          disabled={disabled}
          className="nf-input nf-select w-full truncate text-left disabled:cursor-not-allowed disabled:opacity-70"
          style={{
            backgroundColor: "var(--input-bg)",
            color: selected ? "var(--input-text)" : "var(--text-muted)",
            borderColor: "var(--input-border)",
          }}
        >
          {selected ? getLabel(selected) : placeholder}
        </button>
      )}
    >
      <SearchableEntityPanel
        options={options}
        valueKey={valueKey}
        getLabel={getLabel}
        value={value}
        onPick={(row) => onChange(String(row[valueKey]))}
        searchPlaceholder={searchPlaceholder}
        noMatchesLabel={noMatchesLabel}
        ariaLabel={ariaLabel}
      />
    </Popover>
  );
}
