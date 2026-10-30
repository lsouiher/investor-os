/**
 * Persona fixtures: the ten synthetic investors of docs/test-personas.md, lettered A–J to line
 * up with the candidate repo's fixtures. Each file holds the complete five-audit payload in the
 * vocabulary the audit pages post (section ids, field names and <option value>s from
 * frontend/components/audit/sections/*.ts), plus the predictions from the doc and the
 * must_include / must_exclude assertions the eval harness checks (see assertions.ts).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

export const PERSONA_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'] as const;
export type PersonaLetter = (typeof PERSONA_LETTERS)[number];

export const AUDIT_TYPES = ['financial', 'time', 'skills', 'risk', 'horizon'] as const;
export type AuditTypeName = (typeof AUDIT_TYPES)[number];

export type AuditPayload = Record<string, Record<string, string>>;

/**
 * One auditable check over the generated output.
 *   strategy        — name + description of any (include) / none (exclude) of the three; `rank` narrows to one
 *   archetype       — `one_of` (case-insensitive) or `match`
 *   readiness       — `band` [lo, hi] inclusive
 *   sub_score:<key> — `band` on identity sub_scores[key]
 *   insights        — headline_insight + ai_insights JSON text
 *   contradictions  — ai_insights.contradictions joined (no `match` = must be non-empty)
 *   action_plan     — titles + descriptions of the activated strategy's plan (skipped when not activated)
 */
export interface Assertion {
  target: 'strategy' | 'archetype' | 'readiness' | `sub_score:${string}` | 'insights' | 'contradictions' | 'action_plan';
  /** Case-insensitive regular expression source */
  match?: string;
  one_of?: string[];
  band?: [number, number];
  rank?: number;
}

export interface PersonaFixture {
  letter: PersonaLetter;
  doc_number: number;
  label: string;
  summary: string;
  audits: Record<AuditTypeName, AuditPayload>;
  predicted_primary: string;
  predicted_exclusions: string[];
  tests: string;
  must_include: Assertion[];
  must_exclude: Assertion[];
}

// backend/fixtures/personas, resolved from src/modules/dev-seed (and from dist/ after a build)
export const FIXTURES_DIR = path.resolve(__dirname, '../../../fixtures/personas');

export function normalizeLetter(input: string): PersonaLetter {
  const letter = input.trim().toUpperCase();
  if (!(PERSONA_LETTERS as readonly string[]).includes(letter)) {
    throw new Error(`Unknown persona "${input}" (expected one of ${PERSONA_LETTERS.join(', ')})`);
  }
  return letter as PersonaLetter;
}

export function loadPersona(letter: PersonaLetter): PersonaFixture {
  const file = path.join(FIXTURES_DIR, `${letter}.json`);
  return JSON.parse(readFileSync(file, 'utf8')) as PersonaFixture;
}

export function loadAllPersonas(): PersonaFixture[] {
  return PERSONA_LETTERS.map(loadPersona);
}
