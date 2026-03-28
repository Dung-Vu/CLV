'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { DICTIONARY, Lang } from './dict';

interface I18nContextProps {
  lang: Lang;
  t: (path: string) => string;
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined);

export function I18nProvider({ lang, children }: { lang: string; children: ReactNode }) {
  const currentLang: Lang = lang === 'vi' || lang === 'en' ? lang : 'vi';

  const t = (path: string) => {
    const keys = path.split('.');
    let result: unknown = DICTIONARY[currentLang];
    for (const key of keys) {
      if (!result || typeof result !== 'object' || !(key in result)) {
        return path; // fallback: return the raw key path
      }
      result = (result as Record<string, unknown>)[key];
    }
    return result as string;
  };

  return <I18nContext.Provider value={{ lang: currentLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
