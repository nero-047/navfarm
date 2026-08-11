'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => undefined,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start with "light" so SSR and first-client render match.
  // The inline <script> in layout.tsx sets data-theme BEFORE React hydrates,
  // so the page already shows the correct colours; we just sync React state here.
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    // Read the value the inline script already applied, or fall back to saved pref / system pref
    const applied = document.documentElement.getAttribute(
      'data-theme',
    ) as Theme | null;
    const saved = localStorage.getItem('navfarm_theme') as Theme | null;
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    const resolved = applied || saved || system;
    // Ensure the attribute is set (covers the no-script case)
    document.documentElement.setAttribute('data-theme', resolved);
    setTheme(resolved as Theme);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next: Theme = prev === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('navfarm_theme', next);
      return next;
    });
  };

  // NEVER return null — that blocks the whole app from rendering.
  // Children are always rendered; the theme just starts as "light" before useEffect fires.
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
