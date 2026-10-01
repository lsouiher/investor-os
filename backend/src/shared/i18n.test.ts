import { DEFAULT_LOCALE, SUPPORTED_LOCALES, en, fr, isLocale, isLocalizedText, parseAcceptLanguage, render, t, type MessageKey } from './i18n';

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

  it('renders a parameter that is itself a message in the same language', () => {
    const params = { path: { key: 'path.income_capital' as const }, from: 1, to: 2 };
    expect(t('en', 'growth.staleness.path_regenerated', params)).toBe('Income & Capital path regenerated (v1 → v2)');
    expect(t('fr', 'growth.staleness.path_regenerated', params)).toBe('Revenus et capital\u00a0: parcours régénéré (v1 → v2)');
  });

  it('joins a list of messages with commas', () => {
    const missing = [{ key: 'audit.type.financial' as const }, { key: 'audit.type.time' as const }];
    expect(t('en', 'blueprint.audits_required', { missing })).toBe(
      'All 5 audits must be completed before generating a blueprint. Missing: financial, time.',
    );
    expect(t('fr', 'blueprint.audits_required', { missing })).toContain('Il manque\u00a0: finances, temps.');
  });
});

describe('render', () => {
  it('translates a keyed message and passes written text through', () => {
    expect(render('fr', { key: 'simulation.daily_limit', params: { max: 3 } })).toBe(
      'Maximum de 3 simulations par période de 24 heures. Veuillez réessayer plus tard.',
    );
    expect(render('fr', 'No active prompt template found')).toBe('No active prompt template found');
  });

  it('tells a keyed message from other objects', () => {
    expect(isLocalizedText({ key: 'ai.unavailable' })).toBe(true);
    expect(isLocalizedText({ key: 'not.a.message' })).toBe(false);
    expect(isLocalizedText({ field: 'email' })).toBe(false);
    expect(isLocalizedText('ai.unavailable')).toBe(false);
    expect(isLocalizedText(null)).toBe(false);
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

  // French typography (glossary): a non-breaking space before : ; ? ! % and inside guillemets,
  // typographic apostrophes. U+202F, the narrow variant, is accepted too.
  it.each(keys)('%s follows French typography', (key) => {
    const text = fr[key].replace(/\{\{\w+\}\}/g, 'x');
    expect(text).not.toMatch(/'/);
    expect(text).not.toMatch(/(^|[^\u00a0\u202f])[:;?!%]/);
    expect(text).not.toMatch(/«(?![\u00a0\u202f])/);
    expect(text).not.toMatch(/(^|[^\u00a0\u202f])»/);
  });

  // English is what the API answered before it spoke French (Scenario 4): spot-check that
  // moving the text to keys changed nothing
  it('keeps the English wording of the messages it replaced', () => {
    expect(en['error.internal']).toBe('An unexpected error occurred.');
    expect(en['auth.invalid_credentials']).toBe('Invalid email or password.');
    expect(en['rate_limit.login']).toBe('Too many login attempts. Please try again later.');
    expect(en['ai.unavailable']).toBe("We couldn't process your request right now. Please try again.");
    expect(t('en', 'simulation.daily_limit', { max: 3 })).toBe('Maximum 3 simulations per 24 hours. Please try again later.');
    expect(t('en', 'growth.early_unlock', { criteria: { key: 'growth.unlock_criteria.income_capital' } })).toBe(
      'This path is most valuable after Complete 2+ micro-plan tasks from Portfolio Growth. Set confirm_early_unlock to true to generate now.',
    );
  });
});
