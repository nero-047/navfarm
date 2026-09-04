"use client";
import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export function CollapsibleCard({
  title, subtitle, defaultOpen = false, children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className="rounded-[var(--radius-md)] border"
      style={{ borderColor: "var(--border)" }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span>
          <span className="text-sm font-semibold">{title}</span>
          {subtitle ? (
            <span className="ml-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
              {subtitle}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : undefined }}
        />
      </button>
      <div hidden={!open} className="border-t px-4 py-4" style={{ borderColor: "var(--border)" }}>
        {children}
      </div>
    </div>
  );
}
