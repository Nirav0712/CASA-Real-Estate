'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Locale,
  Direction,
  SUPPORTED_LOCALES,
  DICTIONARY,
  TranslationKey,
} from '@/lib/translations';

interface LanguageContextType {
  locale: Locale;
  direction: Direction;
  isRtl: boolean;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    // Read from localStorage or navigator
    const saved = localStorage.getItem('casa_locale') as Locale;
    if (saved && SUPPORTED_LOCALES[saved]) {
      setLocaleState(saved);
      document.documentElement.lang = saved;
      document.documentElement.dir = SUPPORTED_LOCALES[saved].direction;
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    if (!SUPPORTED_LOCALES[newLocale]) return;
    setLocaleState(newLocale);
    localStorage.setItem('casa_locale', newLocale);
    document.documentElement.lang = newLocale;
    document.documentElement.dir = SUPPORTED_LOCALES[newLocale].direction;
  };

  const direction = SUPPORTED_LOCALES[locale]?.direction || 'ltr';
  const isRtl = direction === 'rtl';

  const t = (key: TranslationKey): string => {
    const localeDict = DICTIONARY[locale];
    if (localeDict && key in localeDict) {
      return localeDict[key];
    }
    // Fallback to English
    return DICTIONARY.en[key] || String(key);
  };

  return (
    <LanguageContext.Provider
      value={{
        locale,
        direction,
        isRtl,
        setLocale,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
