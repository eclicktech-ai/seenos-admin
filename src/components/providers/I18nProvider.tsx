import { useState, useCallback, useEffect, type ReactNode } from "react";
import {
  I18nContext,
  type Language,
  getTranslations,
  createT,
  detectLanguage,
  getStoredLanguage,
  storeLanguage,
} from "@/lib/i18n";

interface I18nProviderProps {
  children: ReactNode;
  defaultLanguage?: Language;
}

export function I18nProvider({ children, defaultLanguage = "en" }: I18nProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Priority: stored > browser detection > default
    return getStoredLanguage() || detectLanguage() || defaultLanguage;
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    storeLanguage(lang);
    // Update HTML lang attribute
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  }, []);

  // Set initial HTML lang attribute
  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  }, [language]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      return createT(language)(key, params);
    },
    [language]
  );

  const translations = getTranslations(language);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, translations }}>
      {children}
    </I18nContext.Provider>
  );
}

