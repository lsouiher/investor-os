import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
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

  /**
   * Value card
   * protects: fail-fast start (research R1) when config/recs.json exists but is wrong: the API
   *   must refuse to start rather than run with an empty or junk calculator list.
   * fails_when: the shape check is loosened, so an empty list (every save refused as "Unknown
   *   calculator") or a bad slug is accepted silently.
   * why_new: only the missing-file branch was tested; the malformed-file branches were not.
   * seam: none (temporary files under os.tmpdir, read through the existing path argument)
   * no_claim: the Dockerfile COPY of config/ (deploy-time, see docs/deploy.md).
   */
  it.each([
    ['not JSON', '{ nope'],
    ['no calculators key', '{}'],
    ['an empty list', '{"calculators":[]}'],
    ['a bad slug', '{"calculators":[{"slug":"Bad Slug"}]}'],
    ['a missing slug', '{"calculators":[{"name":"x"}]}'],
  ])('throws when the file has %s', (_label, content) => {
    const dir = mkdtempSync(join(tmpdir(), 'recs-'));
    const file = join(dir, 'recs.json');
    writeFileSync(file, content);
    try {
      expect(() => loadKnownSlugs(file)).toThrow(/RECS calculator list/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
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

  // Review (red team): other invisible characters let two names look identical
  it('removes zero-width, direction-mark and tag characters, and turns line separators into spaces', () => {
    expect(validateRecsDeal({ ...VALID, name: 'Elm \u200BSt\u200E\u200F\u061C\uFEFF\u2060' }).name).toBe('Elm St');
    expect(validateRecsDeal({ ...VALID, name: 'Elm\u2028St\u2029' }).name).toBe('Elm St');
    expect(validateRecsDeal({ ...VALID, name: 'Elm\u{E0041}\u{E007F}' }).name).toBe('Elm');
  });

  it('rejects a name made only of invisible characters, joiners included', () => {
    expect(failingField({ ...VALID, name: '\u200B\u200D\u200C\uFEFF' })).toBe('name');
    expect(failingField({ ...VALID, name: '\u3164\u00AD\u115F\uFFA0' })).toBe('name');
  });

  it('removes the soft hyphen, the grapheme joiner and the deprecated format characters', () => {
    expect(validateRecsDeal({ ...VALID, name: 'Elm\u00AD\u034FSt\u206A\uFFF9' }).name).toBe('ElmSt');
  });

  // Review (adversarial): a lone surrogate in a JSON body would reach Prisma and could fail with
  // the arguments, payload included, in the error log
  it('removes lone surrogates and rejects a name made only of them', () => {
    expect(validateRecsDeal({ ...VALID, name: 'Elm\uD800St\uDC00' }).name).toBe('ElmSt');
    expect(failingField({ ...VALID, name: '\uDC00\uD800' })).toBe('name');
    expect(validateRecsDeal({ ...VALID, name: 'Elm 🏠' }).name).toBe('Elm 🏠');
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
