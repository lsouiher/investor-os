import { validateRecsDeal, loadKnownSlugs, KNOWN_SLUGS } from './validation';
import { AppError } from '../../shared/middleware/error-handler';

const VALID = { c: 'multifamily', name: 'Elm St 12-plex', d: 'N4IgLgpgdg5g_-' };

function failingField(body: unknown): string | undefined {
  try {
    validateRecsDeal(body as Record<string, unknown>);
  } catch (err) {
    expect(err).toBeInstanceOf(AppError);
    const e = err as AppError;
    expect(e.code).toBe('VALIDATION_ERROR');
    expect(e.statusCode).toBe(400);
    return (e.details[0] as { field: string }).field;
  }
  return undefined;
}

describe('loadKnownSlugs', () => {
  it('loads the eight RECS calculators from config/recs.json', () => {
    expect(KNOWN_SLUGS).toEqual(new Set([
      'multifamily', 'quick-screen', 'single-family', 'fix-and-flip',
      'brrrr', 'wholesaling', 'subject-to', 'short-term-rental',
    ]));
  });

  it('throws a clear error when the file is missing', () => {
    expect(() => loadKnownSlugs('config/nope.json')).toThrow(/config\/nope\.json/);
  });
});

describe('validateRecsDeal', () => {
  it('accepts a valid deal and returns the trimmed name', () => {
    expect(validateRecsDeal({ ...VALID, name: '  Elm St  ' })).toEqual({ ...VALID, name: 'Elm St' });
  });

  it('returns d unchanged', () => {
    const d = 'aZ09_-'.repeat(100);
    expect(validateRecsDeal({ ...VALID, d }).d).toBe(d);
  });

  it('rejects an unknown slug on field c', () => {
    expect(failingField({ ...VALID, c: 'nope' })).toBe('c');
  });

  it('rejects non-string fields', () => {
    expect(failingField({ ...VALID, c: 1 })).toBe('c');
    expect(failingField({ ...VALID, name: ['Elm'] })).toBe('name');
    expect(failingField({ ...VALID, d: null })).toBe('d');
    expect(failingField({})).toBe('c');
  });

  it('rejects a name made of spaces', () => {
    expect(failingField({ ...VALID, name: '    ' })).toBe('name');
  });

  it('counts code points: 120 emoji pass, 121 code points fail', () => {
    expect(validateRecsDeal({ ...VALID, name: '🏠'.repeat(120) }).name).toBe('🏠'.repeat(120));
    expect(failingField({ ...VALID, name: 'a'.repeat(121) })).toBe('name');
    expect(failingField({ ...VALID, name: '🏠'.repeat(121) })).toBe('name');
  });

  it('accepts a d of 8,000 characters and rejects 8,001', () => {
    expect(validateRecsDeal({ ...VALID, d: 'a'.repeat(8000) }).d).toHaveLength(8000);
    expect(failingField({ ...VALID, d: 'a'.repeat(8001) })).toBe('d');
  });

  it.each(['ab+c', 'ab/c', 'abc=', 'ab c', 'ab%41', ''])('rejects d %p', (d) => {
    expect(failingField({ ...VALID, d })).toBe('d');
  });

  it('turns control characters into spaces and removes bidi formatting characters', () => {
    expect(validateRecsDeal({ ...VALID, name: 'Elm\tSt‮' }).name).toBe('Elm St');
    expect(validateRecsDeal({ ...VALID, name: '⁦Elm\u0085St⁩' }).name).toBe('Elm St');
  });

  it('rejects a name made only of control and bidi characters', () => {
    expect(failingField({ ...VALID, name: '\t\n‮⁦\u0000' })).toBe('name');
  });

  it('keeps an emoji ZWJ sequence unchanged', () => {
    const family = '👨‍👩‍👧';
    expect(validateRecsDeal({ ...VALID, name: family }).name).toBe(family);
  });

  it('reports the first failing field in the order c, name, d', () => {
    expect(failingField({ c: 'nope', name: '', d: '+' })).toBe('c');
    expect(failingField({ ...VALID, name: '', d: '+' })).toBe('name');
  });

  it('never echoes d in the error message', () => {
    const d = 'secret+payload';
    try {
      validateRecsDeal({ ...VALID, d });
      throw new Error('expected a validation error');
    } catch (err) {
      expect(JSON.stringify({ m: (err as AppError).message, d: (err as AppError).details })).not.toContain('secret');
    }
  });
});
