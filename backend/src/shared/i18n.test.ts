import { DEFAULT_LOCALE, SUPPORTED_LOCALES, en, fr, isLocale, parseAcceptLanguage, t, type MessageKey } from './i18n';

describe('isLocale', () => {
  it('accepts the supported languages only', () => {
    expect(isLocale('en')).toBe(true);
    expect(isLocale('fr')).toBe(true);
    expect(isLocale('fr-CA')).toBe(false);
    expect(isLocale('es')).toBe(false);
    expect(isLocale('')).toBe(false);
    expect(isLocale(undefined)).toBe(false);
    expect(isLocale(42)).toBe(false);
  });

  it('defaults to English', () => {
    expect(DEFAULT_LOCALE).toBe('en');
    expect(SUPPORTED_LOCALES).toEqual(['en', 'fr']);
  });
});

describe('parseAcceptLanguage', () => {
  it('resolves regional French to French', () => {
    expect(parseAcceptLanguage('fr-CA')).toBe('fr');
    expect(parseAcceptLanguage('fr-FR,fr;q=0.9')).toBe('fr');
    expect(parseAcceptLanguage('FR-be')).toBe('fr');
  });

  it('takes the first supported preference', () => {
    expect(parseAcceptLanguage('en-US,fr;q=0.8')).toBe('en');
    expect(parseAcceptLanguage('fr;q=0.9,en;q=0.8')).toBe('fr');
    expect(parseAcceptLanguage('es,fr;q=0.5,en;q=0.4')).toBe('fr');
  });

  it('honors q-values over header order', () => {
    expect(parseAcceptLanguage('en;q=0.5,fr;q=0.9')).toBe('fr');
    expect(parseAcceptLanguage('fr;q=0.2, en;q=0.7')).toBe('en');
  });

  it('skips a language refused with q=0', () => {
    expect(parseAcceptLanguage('fr;q=0,en;q=0.1')).toBe('en');
    expect(parseAcceptLanguage('fr;q=0')).toBe('en');
  });

  it('falls back to English for unsupported or missing headers', () => {
    expect(parseAcceptLanguage('es')).toBe('en');
    expect(parseAcceptLanguage('*')).toBe('en');
    expect(parseAcceptLanguage('')).toBe('en');
    expect(parseAcceptLanguage(undefined)).toBe('en');
    expect(parseAcceptLanguage(null)).toBe('en');
  });

  it('survives a malformed header', () => {
    expect(parseAcceptLanguage(',,;q=,fr;q=abc')).toBe('en');
    expect(parseAcceptLanguage('fr;q=abc,fr-CA;q=0.3')).toBe('fr');
  });
});

describe('t', () => {
  it('renders the message in the requested language', () => {
    expect(t('en', 'validation.locale_invalid')).toBe('Invalid language.');
    expect(t('fr', 'validation.locale_invalid')).toBe('Langue non valide.');
  });

  it('fills {{placeholders}}', () => {
    expect(t('en', 'validation.locale_options', { locales: 'en, fr' })).toBe('Must be one of: en, fr.');
    expect(t('fr', 'validation.locale_options', { locales: 'en, fr' })).toContain('en, fr');
  });

  it('leaves a placeholder visible when its parameter is missing', () => {
    expect(t('en', 'validation.locale_options')).toBe('Must be one of: {{locales}}.');
  });
});

describe('dictionaries', () => {
  const placeholders = (text: string) => [...text.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort();
  const keys = Object.keys(en) as MessageKey[];

  it('has the same keys in both languages', () => {
    expect(Object.keys(fr).sort()).toEqual([...keys].sort());
  });

  it.each(keys)('%s has the same placeholders and no empty text', (key) => {
    expect(en[key].trim()).not.toBe('');
    expect(fr[key].trim()).not.toBe('');
    expect(placeholders(fr[key])).toEqual(placeholders(en[key]));
  });
});
