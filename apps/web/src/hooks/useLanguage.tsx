'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { translations, TranslationKeys } from '../utils/translations';

export type Language = 'en' | 'hi' | 'mr' | 'es' | 'fr' | 'bn' | 'te' | 'ta';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKeys) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  setLanguage: () => undefined,
  t: (key: TranslationKeys) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLangState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('navfarm_lang') as Language | null;
    if (
      saved === 'en' ||
      saved === 'hi' ||
      saved === 'mr' ||
      saved === 'es' ||
      saved === 'fr' ||
      saved === 'bn' ||
      saved === 'te' ||
      saved === 'ta'
    ) {
      setLangState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLangState(lang);
    localStorage.setItem('navfarm_lang', lang);
  };

  const t = (key: TranslationKeys): string => {
    const dict = translations[language] || translations.en;
    return dict[key] || translations.en[key] || key;
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
