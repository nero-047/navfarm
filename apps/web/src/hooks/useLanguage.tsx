"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { translations, TranslationKeys } from "../utils/translations";
import { masterDataLabelTranslations } from "../utils/master-data-translations";
import { resolveLobFamily, LOB_LABEL_KEY } from "@/lib/lob";

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
  tLob: (code?: string | null) => string;
  tLabel: (text: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  setLanguage: () => undefined,
  t: (key: TranslationKeys) => key,
  tLob: (code?: string | null) => code || "",
  tLabel: (text: string) => text,
});

const VALID_LANGUAGES: Language[] = ["en", "hi", "mr", "es", "fr", "bn", "te", "ta"];

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLangState] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("navfarm_lang") as Language | null;
    if (saved && VALID_LANGUAGES.includes(saved)) {
      setLangState(saved);
    }

    // persistAuthSession (lib/api-client.ts) fires this right after login,
    // once the user's saved ui_language is known — login doesn't remount
    // this provider (client-side navigation), so without this the language
    // wouldn't switch to the account's preference until a hard reload.
    const onSync = (e: Event) => {
      const lang = (e as CustomEvent<string>).detail as Language;
      if (lang && VALID_LANGUAGES.includes(lang)) setLangState(lang);
    };
    window.addEventListener("navfarm:lang-sync", onSync);
    return () => window.removeEventListener("navfarm:lang-sync", onSync);
  }, []);

  const setLanguage = (lang: Language) => {
    setLangState(lang);
    localStorage.setItem("navfarm_lang", lang);
    // Best-effort: persist to the account so the next login on any device
    // opens in this language. Silently no-ops when signed out.
    if (localStorage.getItem("navfarm_access_token")) {
      import("../lib/api-client").then(({ api }) =>
        api.patch("/auth/profile", { ui_language: lang }).catch(() => void 0)
      );
    }
  };

  const t = (key: TranslationKeys, vars?: TranslationVars): string => {
    const dict = (translations[language] || translations.en) as Partial<Record<TranslationKeys, string>>;
    const template = dict[key] || translations.en[key] || key;
    return interpolate(template, vars);
  };

  // LOB codes are raw enums (PIGGERY/DAIRY/POULTRY). Interpolating one straight
  // into a translated string produced half-translated headings like
  // "PIGGERY डैशबोर्ड" — the sentence localised, the subject left in English.
  // Resolves through the shared LOB registry rather than matching three bare
  // words: a real code like "LVS_PIGGERY" used to fall through and render
  // literally in the UI.
  const tLob = (code?: string | null): string => t(LOB_LABEL_KEY[resolveLobFamily(code)]);

  const tLabel = (text: string): string => {
    if (language === "en") return text;
    return masterDataLabelTranslations[text]?.[language] || text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tLob, tLabel }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
