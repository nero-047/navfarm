"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { translations, TranslationKeys } from "../utils/translations";

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
}

const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  setLanguage: () => undefined,
  t: (key: TranslationKeys) => key,
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

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
