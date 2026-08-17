"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type ResolvedTheme = "light" | "dark";
type ThemePreference = "system" | "light" | "dark";

interface ThemeContextValue {
  /** The theme actually applied to the page right now. */
  theme: ResolvedTheme;
  /** What the user asked for — "system" tracks the OS live. */
  preference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => void;
  /** Back-compat single-click toggle for ThemeIconButton: flips the
   *  resolved theme, converting an implicit "system" into an explicit
   *  choice the same way clicking a light/dark switch always has. */
  toggleTheme: () => void;
}

const STORAGE_KEY = "navfarm_theme";

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolve(pref: ThemePreference): ResolvedTheme {
  return pref === "system" ? (systemPrefersDark() ? "dark" : "light") : pref;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  preference: "system",
  setThemePreference: () => undefined,
  toggleTheme: () => undefined,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start with "light"/"system" so SSR and first-client render match.
  // The inline <script> in layout.tsx sets data-theme BEFORE React
  // hydrates, so the page already shows the correct colours; we just
  // sync React state here.
  const [preference, setPreference] = useState<ThemePreference>("system");
  const [theme, setTheme] = useState<ResolvedTheme>("light");

  useEffect(() => {
    // Read the value the inline script already applied, or fall back to
    // saved preference / system preference — same resolution order as
    // the inline script, so React state always matches the DOM.
    const applied = document.documentElement.getAttribute("data-theme") as ResolvedTheme | null;
    const saved = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
    const pref: ThemePreference = saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
    const resolved = applied || resolve(pref);
    document.documentElement.setAttribute("data-theme", resolved);
    setPreference(pref);
    setTheme(resolved);
  }, []);

  useEffect(() => {
    // Only "system" needs to react live — an explicit light/dark choice
    // is not overwritten by an OS change.
    if (preference !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const resolved = resolve("system");
      document.documentElement.setAttribute("data-theme", resolved);
      setTheme(resolved);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [preference]);

  const setThemePreference = (pref: ThemePreference) => {
    const resolved = resolve(pref);
    document.documentElement.setAttribute("data-theme", resolved);
    localStorage.setItem(STORAGE_KEY, pref);
    setPreference(pref);
    setTheme(resolved);
  };

  const toggleTheme = () => {
    setThemePreference(theme === "light" ? "dark" : "light");
  };

  // NEVER return null — that blocks the whole app from rendering.
  // Children are always rendered; the theme just starts as "light" before useEffect fires.
  return (
    <ThemeContext.Provider value={{ theme, preference, setThemePreference, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
