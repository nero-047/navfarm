"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { translations, TranslationKeys } from "../utils/translations";
import { masterDataLabelTranslations } from "../utils/master-data-translations";

export type Language = "en" | "hi" | "mr" | "es" | "fr" | "bn" | "te" | "ta";

type TranslationVars = Record<string, string | number>;

function interpolate(template: string, vars?: TranslationVars): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match
  );
}

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKeys, vars?: TranslationVars) => string;
  /** Looks up a literal English UI string (not a translation key) — for
   * data-driven label/description text like Master Data's configs.ts,
   * where rewriting every string into a keyed dictionary isn't practical.
   * Falls back to the English text itself when no translation exists. */
  tLabel: (text: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  setLanguage: () => undefined,
  t: (key: TranslationKeys) => key,
  tLabel: (text: string) => text,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLangState] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("navfarm_lang") as Language | null;
    if (
      saved === "en" ||
      saved === "hi" ||
      saved === "mr" ||
      saved === "es" ||
      saved === "fr" ||
      saved === "bn" ||
      saved === "te" ||
      saved === "ta"
    ) {
      setLangState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLangState(lang);
    localStorage.setItem("navfarm_lang", lang);
  };

  const t = (key: TranslationKeys, vars?: TranslationVars): string => {
    const dict = (translations[language] || translations.en) as Partial<Record<TranslationKeys, string>>;
    const template = dict[key] || translations.en[key] || key;
    return interpolate(template, vars);
  };

  const tLabel = (text: string): string => {
    if (language === "en") return text;
    return masterDataLabelTranslations[text]?.[language] || text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tLabel }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
