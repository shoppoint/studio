"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { translations, Language, TranslationKey } from "./translations";

type I18nContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: TranslationKey;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Set default language to zh-HK for Hong Kong target audience
  const [lang, setLang] = useState<Language>("zh-HK");

  // Load language preference from localStorage if available
  useEffect(() => {
    const savedLang = localStorage.getItem("language") as Language;
    if (savedLang && (savedLang === "en" || savedLang === "zh-HK")) {
      setLang(savedLang);
    }
  }, []);

  const handleSetLang = useCallback((newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("language", newLang);
  }, []);

  const value: I18nContextType = useMemo(() => ({
    lang,
    setLang: handleSetLang,
    t: translations[lang] as any,
  }), [lang, handleSetLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
