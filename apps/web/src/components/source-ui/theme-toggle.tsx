"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "32px",
        height: "32px",
        borderRadius: "8px",
        border: "1px solid var(--border)",
        backgroundColor: "var(--surface-raised)",
        color: "var(--text-secondary)",
        cursor: "pointer",
        flexShrink: 0,
        // No transition on these so the icon swap is instant
        transition: "background-color 150ms, border-color 150ms",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--accent-muted)";
        (e.currentTarget as HTMLButtonElement).style.color = "var(--accent)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--surface-raised)";
        (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
      }}
    >
      {isDark ? (
        <Sun style={{ width: "16px", height: "16px" }} />
      ) : (
        <Moon style={{ width: "16px", height: "16px" }} />
      )}
    </button>
  );
}
