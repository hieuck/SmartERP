import type { PropsWithChildren, ReactElement } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Locale } from "antd/es/locale";
import enUS from "antd/locale/en_US";
import viVN from "antd/locale/vi_VN";

import en from "../locales/en";
import vi from "../locales/vi";

export type SupportedLanguage = "vi" | "en";

type TranslationTree = {
  [key: string]: string | TranslationTree;
};

type LocaleContextValue = {
  language: SupportedLanguage;
  antdLocale: Locale;
  localeCode: string;
  setLanguage: (language: SupportedLanguage) => void;
  t: (path: string, params?: Record<string, string | number>) => string;
  formatCurrency: (amount: number, currency?: string) => string;
};

const STORAGE_KEY = "smarterp-next-language";

const localeMap: Record<SupportedLanguage, TranslationTree> = {
  vi,
  en,
};

const antdLocaleMap: Record<SupportedLanguage, Locale> = {
  vi: viVN,
  en: enUS,
};

const localeCodeMap: Record<SupportedLanguage, string> = {
  vi: "vi-VN",
  en: "en-US",
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function getInitialLanguage(): SupportedLanguage {
  if (typeof window === "undefined") {
    return "vi";
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "vi" || stored === "en") {
    return stored;
  }

  return "vi";
}

function resolvePath(tree: TranslationTree, path: string): string {
  const value = path.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object" && key in current) {
      return (current as Record<string, unknown>)[key];
    }

    return path;
  }, tree);

  return typeof value === "string" ? value : path;
}

function applyParams(template: string, params?: Record<string, string | number>): string {
  if (!params) {
    return template;
  }

  return Object.entries(params).reduce((current, [key, value]) => {
    return current.replaceAll(`{{${key}}}`, String(value));
  }, template);
}

export function LocaleProvider({ children }: PropsWithChildren): ReactElement {
  const [language, setLanguageState] = useState<SupportedLanguage>(getInitialLanguage);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, language);
      document.documentElement.lang = language;
    }
  }, [language]);

  function setLanguage(nextLanguage: SupportedLanguage): void {
    setLanguageState(nextLanguage);
  }

  const value = useMemo<LocaleContextValue>(() => {
    const localeCode = localeCodeMap[language];

    return {
      language,
      antdLocale: antdLocaleMap[language],
      localeCode,
      setLanguage,
      t: (path, params) => applyParams(resolvePath(localeMap[language], path), params),
      formatCurrency: (amount, currency = "VND") =>
        new Intl.NumberFormat(localeCode, {
          style: "currency",
          currency,
          maximumFractionDigits: 0,
        }).format(amount),
    };
  }, [language]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocale must be used inside LocaleProvider.");
  }

  return context;
}
