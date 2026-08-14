"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

export function ThemeIconButton() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      onClick={toggleTheme}
      title={isDark ? "Switch to Light" : "Switch to Dark"}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="nf-press flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors sm:h-9 sm:w-9"
      style={{ borderColor: "var(--border)", color: "var(--text-secondary)", backgroundColor: "transparent" }}
    >
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}
