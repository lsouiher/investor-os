// Dictionary lookup and locale-aware formatting, as plain functions. The React provider
// (lib/i18n.tsx) binds them to the current language; server components (the root layout's
// metadata) and code outside React call them directly. No "use client" here: a server
// component cannot call a function exported from a client module.

import en from "@/locales/en.json";
import fr from "@/locales/fr.json";
import { DEFAULT_LOCALE, type Locale } from "./locale";

export type TranslateParams = Record<string, string | number>;
type DateInput = Date | string | number;

const dictionaries: Record<Locale, Record<string, string>> = { en, fr };

// Plurals, dates and numbers follow the interface language, not the device
const INTL_TAG: Record<Locale, string> = { en: "en-US", fr: "fr" };

const pluralRules: Record<Locale, Intl.PluralRules> = {
  en: new Intl.PluralRules(INTL_TAG.en),
  fr: new Intl.PluralRules(INTL_TAG.fr),
};

// Counted text has two variants, `<key>.one` and `<key>.other`. French is singular for 0
// and 1, English for 1 only; every other plural category ("many" in French) reads as "other".
function find(locale: Locale, key: string, count: number | undefined): string | undefined {
  const dictionary = dictionaries[locale];
  if (count !== undefined) {
    const form = pluralRules[locale].select(count) === "one" ? "one" : "other";
    const counted = dictionary[`${key}.${form}`];
    if (counted !== undefined) return counted;
  }
  return dictionary[key];
}

/**
 * The text for `key` in `locale`, with `{{param}}` placeholders filled. A numeric `count`
 * parameter selects the plural variant. Text missing in French falls back to English.
 */
export function translate(locale: Locale, key: string, params?: TranslateParams): string {
  const count = typeof params?.count === "number" ? params.count : undefined;
  const template =
    find(locale, key, count) ??
    (locale === DEFAULT_LOCALE ? undefined : find(DEFAULT_LOCALE, key, count)) ??
    key;
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(params[name] ?? `{{${name}}}`));
}

/**
 * For a key built from data (an audit field's optional placeholder, the heading of a growth
 * content block): the text when a language has it, otherwise `fallback`.
 */
export function translateOr<T extends string | undefined>(locale: Locale, key: string, fallback: T): string | T {
  return dictionaries[locale][key] ?? dictionaries[DEFAULT_LOCALE][key] ?? fallback;
}

function format(locale: Locale, value: DateInput, options: Intl.DateTimeFormatOptions): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(INTL_TAG[locale], options).format(date);
}

// The defaults are the ones toLocaleDateString() and toLocaleTimeString() use, so English
// reads as it did before these helpers existed. Pass options for another style:
// { dateStyle: "medium" } gives "Sep 30, 2026" / "30 sept. 2026".
const NUMERIC_DATE: Intl.DateTimeFormatOptions = { year: "numeric", month: "numeric", day: "numeric" };
const NUMERIC_TIME: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "numeric", second: "numeric" };

/** "9/30/2026" / "30/09/2026" */
export function formatDate(
  locale: Locale,
  value: DateInput,
  options: Intl.DateTimeFormatOptions = NUMERIC_DATE
): string {
  return format(locale, value, options);
}

/** "3:45:12 PM" / "15:45:12" */
export function formatTime(
  locale: Locale,
  value: DateInput,
  options: Intl.DateTimeFormatOptions = NUMERIC_TIME
): string {
  return format(locale, value, options);
}

/** "1,000.5" / "1 000,5" */
export function formatNumber(locale: Locale, value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(INTL_TAG[locale], options).format(value);
}

/** Takes the 0–100 scale the app stores scores in: 68 gives "68%" / "68 %". */
export function formatPercent(locale: Locale, value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(INTL_TAG[locale], { style: "percent", maximumFractionDigits: 0, ...options }).format(
    value / 100
  );
}
