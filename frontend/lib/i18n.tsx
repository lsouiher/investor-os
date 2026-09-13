"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import en from "@/locales/en.json";
import fr from "@/locales/fr.json";

type Locale = "en" | "fr";

const dictionaries: Record<Locale, Record<string, string>> = { en, fr };

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  setLocale: () => {},
  t: (key) => key,
});

function lookup(dict: Record<string, string>, key: string): string | undefined {
  return dict[key];
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(params[k] ?? `{{${k}}}`));
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    let stored: string | null = null;
    try { stored = localStorage.getItem("locale"); } catch {}
    if (stored === "en" || stored === "fr") {
      setLocaleState(stored);
      document.documentElement.lang = stored;
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try { localStorage.setItem("locale", l); } catch {}
    document.documentElement.lang = l;
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const val = lookup(dictionaries[locale], key) ?? lookup(dictionaries.en, key) ?? key;
      return interpolate(val, params);
    },
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  return useContext(I18nContext);
}
