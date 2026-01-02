import { createContext, useContext } from "react";
import { en, type Translations } from "./locales/en";
import { zh } from "./locales/zh";

export type Language = "en" | "zh";

export const languages: { code: Language; name: string; nativeName: string }[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "zh", name: "Chinese", nativeName: "中文" },
];

const translations: Record<Language, Translations> = {
  en,
  zh,
};

// Get translation for a specific language
export function getTranslations(lang: Language): Translations {
  return translations[lang] || translations.en;
}

// Get nested value from object using dot notation
function getNestedValue(obj: unknown, path: string): string {
  const keys = path.split(".");
  let value: unknown = obj;
  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return path; // Return path if not found
    }
  }
  return typeof value === "string" ? value : path;
}

// i18n Context
export interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  translations: Translations;
}

export const I18nContext = createContext<I18nContextType | null>(null);

// Hook to use i18n
export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

// Simple hook that returns translation function
export function useTranslation() {
  const { t, language } = useI18n();
  return { t, language };
}

// Create translation function for a language
export function createT(lang: Language) {
  const trans = getTranslations(lang);
  return (key: string, params?: Record<string, string | number>): string => {
    let value = getNestedValue(trans, key);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        value = value.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      });
    }
    return value;
  };
}

// Detect browser language
export function detectLanguage(): Language {
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith("zh")) {
    return "zh";
  }
  return "en";
}

// Get stored language preference
export function getStoredLanguage(): Language | null {
  const stored = localStorage.getItem("language");
  if (stored === "en" || stored === "zh") {
    return stored;
  }
  return null;
}

// Store language preference
export function storeLanguage(lang: Language): void {
  localStorage.setItem("language", lang);
}

export { type Translations } from "./locales/en";

