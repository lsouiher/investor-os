// Text the server writes, in both languages, and how the server reads a language off a
// request. The frontend has its own dictionaries (frontend/locales); this one covers what is
// rendered here: error messages, and later the email, the PDF and the export.
//
// French follows the interface conventions: formal "vous", a non-breaking space ( )
// before : ; ? ! %, typographic apostrophes.

export const SUPPORTED_LOCALES = ['en', 'fr'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * Picks the language for an `Accept-Language` header: the supported language the client
 * prefers most (highest q-value, header order on ties). Any regional French (`fr-CA`,
 * `fr-FR`) is French. Nothing supported, or no header: English.
 */
export function parseAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;

  const preferences = header
    .split(',')
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(';');
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
      const quality = q ? Number(q.slice(2)) : 1;
      return { language: tag.trim().toLowerCase().split('-')[0], quality, index };
    })
    .filter((p) => p.quality > 0) // q=0 means "not acceptable"; NaN (malformed) drops out too
    .sort((a, b) => b.quality - a.quality || a.index - b.index);

  for (const { language } of preferences) {
    if (isLocale(language)) return language;
  }
  return DEFAULT_LOCALE;
}

export const en = {
  'validation.locale_invalid': 'Invalid language.',
  'validation.locale_options': 'Must be one of: {{locales}}.',
};

export type MessageKey = keyof typeof en;

// Typed against the English keys: a key missing here does not compile
export const fr: Record<MessageKey, string> = {
  'validation.locale_invalid': 'Langue non valide.',
  'validation.locale_options': 'Doit être l’une des valeurs suivantes : {{locales}}.',
};

const dictionaries: Record<Locale, Record<MessageKey, string>> = { en, fr };

/** Renders a message in the given language, filling `{{param}}` placeholders. */
export function t(locale: Locale, key: MessageKey, params: Record<string, string | number> = {}): string {
  return dictionaries[locale][key].replace(/\{\{(\w+)\}\}/g, (placeholder, name: string) =>
    name in params ? String(params[name]) : placeholder,
  );
}
