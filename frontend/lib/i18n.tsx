"use client";

import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { DEFAULT_LOCALE, writeLocaleCookie, type Locale } from "./locale";
import {
  translate,
  formatDate,
  formatTime,
  formatNumber,
  formatPercent,
  type TranslateParams,
} from "./translate";

// For code outside React (the API client, helpers). Server components import it from
// "@/lib/translate" instead: they cannot call into this client module.
export { translate };

type DateInput = Date | string | number;

interface I18nContextValue {
  locale: Locale;
  /** Switches the interface on this device. Saving the choice to the account is the caller's job. */
  setLocale: (l: Locale) => void;
  t: (key: string, params?: TranslateParams) => string;
  formatDate: (value: DateInput, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (value: DateInput, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatPercent: (value: number, options?: Intl.NumberFormatOptions) => string;
}

function bindLocale(locale: Locale): Omit<I18nContextValue, "locale" | "setLocale"> {
  return {
    t: (key, params) => translate(locale, key, params),
    formatDate: (value, options) => formatDate(locale, value, options),
    formatTime: (value, options) => formatTime(locale, value, options),
    formatNumber: (value, options) => formatNumber(locale, value, options),
    formatPercent: (value, options) => formatPercent(locale, value, options),
  };
}

const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  ...bindLocale(DEFAULT_LOCALE),
});

// `initialLocale` is decided on the server (proxy.ts, then the root layout), so the first
// paint is already in the right language and nothing flips after load.
export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    writeLocaleCookie(next);
    // The server rendered these for the previous language; keep them in step without a reload
    document.documentElement.lang = next;
    document.title = translate(next, "meta.title");
  }, []);

  const value = useMemo(() => ({ locale, setLocale, ...bindLocale(locale) }), [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  return useContext(I18nContext);
}
