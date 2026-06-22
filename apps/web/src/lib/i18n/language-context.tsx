'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { translations, type Lang } from './translations';

type DeepMutable<T> = {
  -readonly [P in keyof T]: T[P] extends readonly (infer U)[]
    ? DeepMutable<U>[]
    : T[P] extends object
    ? DeepMutable<T[P]>
    : T[P];
};

type TranslationShape = DeepMutable<typeof translations.bn>;

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: TranslationShape;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'bn',
  setLang: () => {},
  t: translations.bn as unknown as TranslationShape,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('bn');

  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('unkora_lang') as Lang | null;
    if (saved === 'en' || saved === 'bn') {
      setLangState(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem('unkora_lang', l);
    document.documentElement.lang = l === 'bn' ? 'bn' : 'en';
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] as unknown as TranslationShape }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
