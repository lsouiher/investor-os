// The languages the interface supports and how a device's language is decided.
// No React and no dictionaries in here: proxy.ts runs this on every page request.

export const LOCALES = ["en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

/** Cookie holding the device's explicit choice (the switch, or a ?lang= link). */
export const LOCALE_COOKIE = "locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Request header through which proxy.ts tells the root layout which language to render. */
export const LOCALE_HEADER = "x-locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * Picks the language for an `Accept-Language` header: the supported language the browser
 * prefers most (highest q-value, header order on ties). Any regional French (`fr-CA`,
 * `fr-FR`) is French. Nothing supported, or no header: English.
 * Same rules as `parseAcceptLanguage` in backend/src/shared/i18n.ts.
 */
export function negotiateLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const preferences = acceptLanguage
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      const quality = q ? Number(q.slice(2)) : 1;
      return { language: tag.trim().toLowerCase().split("-")[0], quality, index };
    })
    .filter((p) => p.quality > 0) // q=0 means "not acceptable"; NaN (malformed) drops out too
    .sort((a, b) => b.quality - a.quality || a.index - b.index);

  for (const { language } of preferences) {
    if (isLocale(language)) return language;
  }
  return DEFAULT_LOCALE;
}

/** Remembers an explicit choice on this device for a year. Browser only. */
export function writeLocaleCookie(locale: Locale): void {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`;
}
