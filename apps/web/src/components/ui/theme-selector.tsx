"use client";

import { Monitor, Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "system", icon: Monitor, labelKey: "themeSystem" },
  { value: "light", icon: Sun, labelKey: "themeLight" },
  { value: "dark", icon: Moon, labelKey: "themeDark" },
] as const;

/** Three-way System/Light/Dark control. A segmented group rather than a
 * dropdown: with only three options, every choice stays visible and
 * reachable in one tab stop, which a <select> would hide behind a click. */
export function ThemeSelector({ className }: { className?: string }) {
  const { preference, setThemePreference } = useTheme();
  const { t } = useLanguage();

  return (
    <div
      role="radiogroup"
      aria-label={t("themeLabel")}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-[var(--radius-pill)] border p-0.5",
        className
      )}
      style={{ borderColor: "var(--border)" }}
    >
      {OPTIONS.map(({ value, icon: Icon, labelKey }) => {
        const active = preference === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={t(labelKey)}
            title={t(labelKey)}
            onClick={() => setThemePreference(value)}
            className="nf-press flex h-7 w-7 items-center justify-center rounded-[var(--radius-pill)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            style={{
              backgroundColor: active ? "var(--accent)" : "transparent",
              color: active ? "#fff" : "var(--text-secondary)",
            }}
          >
            <Icon size={14} />
          </button>
        );
      })}
    </div>
  );
}
