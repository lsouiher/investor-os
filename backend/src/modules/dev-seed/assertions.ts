/**
 * Runs a fixture's must_include / must_exclude assertions over one persona's generated output.
 * Deliberately simple and auditable: regex presence, set membership, numeric bands. No judge.
 */
import type { Assertion, PersonaFixture } from './fixtures.js';

export interface EvalIdentity {
  archetype: string;
  readiness_score: number;
  sub_scores: Record<string, number>;
  headline_insight: string;
  ai_insights: Record<string, unknown>;
}

export interface EvalStrategy {
  name: string;
  description: string;
  rank: number;
  fit_score?: number;
  is_active?: boolean;
}

export interface EvalActionPlan {
  items: Array<{ title: string; description: string | null }>;
}

/** The slice of the app's output the assertions look at (also what raw/<persona>-<run>.json stores). */
export interface EvalOutput {
  identity: EvalIdentity | null;
  strategies: EvalStrategy[];
  action_plan: EvalActionPlan | null;
}

export interface AssertionResult {
  kind: 'include' | 'exclude';
  assertion: Assertion;
  status: 'pass' | 'fail' | 'skip';
  detail: string;
}

function describe(a: Assertion): string {
  const where = a.target + (a.rank ? `#${a.rank}` : '');
  if (a.one_of) return `${where} ∈ {${a.one_of.join(' | ')}}`;
  if (a.band) return `${where} within [${a.band[0]}, ${a.band[1]}]`;
  if (a.match) return `${where} ~ /${a.match}/i`;
  return `${where} non-empty`;
}

function regex(a: Assertion): RegExp | null {
  return a.match ? new RegExp(a.match, 'i') : null;
}

function strategyTexts(out: EvalOutput, a: Assertion): string[] {
  return out.strategies
    .filter((s) => (a.rank ? s.rank === a.rank : true))
    .map((s) => `${s.name} ${s.description}`);
}

/** Which texts match the assertion's pattern, for the target the assertion names. */
function matches(out: EvalOutput, a: Assertion): { hits: string[]; total: number } | 'skip' {
  const re = regex(a);
  const hitsIn = (texts: string[]) => ({ hits: re ? texts.filter((t) => re.test(t)) : texts.filter((t) => t.trim() !== ''), total: texts.length });

  switch (a.target) {
    case 'strategy':
      return hitsIn(strategyTexts(out, a));
    case 'insights': {
      if (!out.identity) return 'skip';
      return hitsIn([`${out.identity.headline_insight} ${JSON.stringify(out.identity.ai_insights)}`]);
    }
    case 'contradictions': {
      if (!out.identity) return 'skip';
      const raw = out.identity.ai_insights?.contradictions;
      const list = Array.isArray(raw) ? raw.map(String) : [];
      return hitsIn(list);
    }
    case 'action_plan': {
      if (!out.action_plan) return 'skip';
      return hitsIn(out.action_plan.items.map((i) => `${i.title} ${i.description ?? ''}`));
    }
    default:
      return 'skip';
  }
}

function evaluateOne(out: EvalOutput, a: Assertion, kind: 'include' | 'exclude'): AssertionResult {
  const label = describe(a);

  if (a.target === 'archetype') {
    if (!out.identity) return { kind, assertion: a, status: 'skip', detail: `${label}: no identity` };
    const got = out.identity.archetype;
    const re = regex(a);
    const inSet = a.one_of ? a.one_of.some((x) => x.toLowerCase() === got.toLowerCase()) : re ? re.test(got) : false;
    const ok = kind === 'include' ? inSet : !inSet;
    return { kind, assertion: a, status: ok ? 'pass' : 'fail', detail: `${label}: got "${got}"` };
  }

  if (a.target === 'readiness' || a.target.startsWith('sub_score:')) {
    if (!out.identity) return { kind, assertion: a, status: 'skip', detail: `${label}: no identity` };
    const value = a.target === 'readiness' ? out.identity.readiness_score : out.identity.sub_scores?.[a.target.slice('sub_score:'.length)];
    if (typeof value !== 'number' || !a.band) return { kind, assertion: a, status: 'fail', detail: `${label}: value missing` };
    const inBand = value >= a.band[0] && value <= a.band[1];
    const ok = kind === 'include' ? inBand : !inBand;
    return { kind, assertion: a, status: ok ? 'pass' : 'fail', detail: `${label}: got ${value}` };
  }

  const m = matches(out, a);
  if (m === 'skip') return { kind, assertion: a, status: 'skip', detail: `${label}: not available` };
  if (kind === 'include') {
    return m.hits.length > 0
      ? { kind, assertion: a, status: 'pass', detail: `${label}: matched ${m.hits.length}/${m.total}` }
      : { kind, assertion: a, status: 'fail', detail: `${label}: no match in ${m.total}` };
  }
  return m.hits.length === 0
    ? { kind, assertion: a, status: 'pass', detail: `${label}: absent from ${m.total}` }
    : { kind, assertion: a, status: 'fail', detail: `${label}: found in "${m.hits[0].slice(0, 80)}"` };
}

export function evaluateFixture(fixture: PersonaFixture, out: EvalOutput): AssertionResult[] {
  return [
    ...fixture.must_include.map((a) => evaluateOne(out, a, 'include')),
    ...fixture.must_exclude.map((a) => evaluateOne(out, a, 'exclude')),
  ];
}

export function summarizeResults(results: AssertionResult[]): { passed: number; failed: number; skipped: number; total: number } {
  return {
    passed: results.filter((r) => r.status === 'pass').length,
    failed: results.filter((r) => r.status === 'fail').length,
    skipped: results.filter((r) => r.status === 'skip').length,
    total: results.length,
  };
}
