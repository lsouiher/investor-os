import { readFileSync } from 'fs';
import { resolve } from 'path';
import { AppError } from '../../shared/middleware/error-handler.js';
import type { RecsDealInput } from './types.js';

// The rules of RECS docs/spec.md §10.8 (FR-10.8.2, DM-7). frontend/lib/recs-import.ts applies
// the same three; keep them identical.
const SLUG_REGEX = /^[a-z0-9-]{1,64}$/;
const PAYLOAD_REGEX = /^[A-Za-z0-9_-]{1,8000}$/;
const MAX_NAME_CODE_POINTS = 120;
const CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F]/g;
const BIDI_FORMATTING = /[\u202A-\u202E\u2066-\u2069]/g;

// Read once at start; the API must not run without the list (research R1), so a missing or
// malformed file throws and the process fails before it takes traffic.
export function loadKnownSlugs(path = 'config/recs.json'): Set<string> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));
  } catch (err) {
    throw new Error(`RECS calculator list ${path} is missing or not JSON: ${(err as Error).message}`);
  }
  const calculators = (parsed as { calculators?: unknown })?.calculators;
  if (
    !Array.isArray(calculators) ||
    calculators.length === 0 ||
    !calculators.every((entry) => typeof entry?.slug === 'string' && SLUG_REGEX.test(entry.slug))
  ) {
    throw new Error(`RECS calculator list ${path} must have a non-empty "calculators" array of { "slug": "a-z0-9-" }.`);
  }
  return new Set(calculators.map((entry: { slug: string }) => entry.slug));
}

export const KNOWN_SLUGS = loadKnownSlugs();

function invalid(field: 'c' | 'name' | 'd', message: string): AppError {
  return new AppError('VALIDATION_ERROR', message, 400, [{ field, message }]);
}

// Control characters become spaces and bidi formatting characters go, so one deal's name cannot
// pass for another's (constitution X). Cleaned, never refused: RECS accepts any non-blank name.
export function cleanName(name: string): string {
  return name.replace(CONTROL_CHARS, ' ').replace(BIDI_FORMATTING, '').trim();
}

export function validateRecsDeal(body: Record<string, unknown>): RecsDealInput {
  const { c, name, d } = body ?? {};
  if (typeof c !== 'string' || !KNOWN_SLUGS.has(c)) {
    throw invalid('c', 'Unknown calculator.');
  }
  const cleaned = typeof name === 'string' ? cleanName(name) : '';
  const length = [...cleaned].length;
  if (length < 1 || length > MAX_NAME_CODE_POINTS) {
    throw invalid('name', `Name must be 1 to ${MAX_NAME_CODE_POINTS} characters.`);
  }
  // The message never includes d: it is the user's deal, and logs keep error messages
  if (typeof d !== 'string' || !PAYLOAD_REGEX.test(d)) {
    throw invalid('d', 'Deal payload is invalid.');
  }
  return { c, name: cleaned, d };
}
