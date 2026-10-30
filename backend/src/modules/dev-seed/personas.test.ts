/**
 * Fixtures must never drift from the audit schema: every file is complete, passes the exact
 * completion validation the PUT /audits/:type endpoint runs, and I stays a twin of A on every
 * capacity input. Option values are checked on the frontend side
 * (frontend/components/audit/sections.test.ts), where the <option value>s live.
 */
import { validateCompletionRequirements } from '../audit/validation';
import { AUDIT_TYPES, PERSONA_LETTERS, loadAllPersonas, loadPersona, type Assertion } from './fixtures';

const personas = loadAllPersonas();

describe('persona fixtures', () => {
  it('has the ten personas A–J, each mapped to a distinct doc number', () => {
    expect(personas.map((p) => p.letter)).toEqual([...PERSONA_LETTERS]);
    expect(new Set(personas.map((p) => p.doc_number)).size).toBe(10);
  });

  it.each(PERSONA_LETTERS)('%s carries the prose fields from docs/test-personas.md', (letter) => {
    const p = loadPersona(letter);
    for (const key of ['label', 'summary', 'predicted_primary', 'tests'] as const) {
      expect(typeof p[key]).toBe('string');
      expect(p[key].length).toBeGreaterThan(0);
    }
    expect(p.predicted_exclusions.length).toBeGreaterThan(0);
  });

  it.each(PERSONA_LETTERS)('%s completes all five audits through the real validation', (letter) => {
    const p = loadPersona(letter);
    for (const type of AUDIT_TYPES) {
      expect(p.audits[type]).toBeDefined();
      expect(() => validateCompletionRequirements(type, p.audits[type])).not.toThrow();
      // Every value is a string, as the form posts them
      for (const section of Object.values(p.audits[type])) {
        for (const value of Object.values(section)) expect(typeof value).toBe('string');
      }
    }
  });

  it.each(PERSONA_LETTERS)('%s has well-formed assertions', (letter) => {
    const p = loadPersona(letter);
    const check = (a: Assertion) => {
      expect(a.target).toMatch(/^(strategy|archetype|readiness|sub_score:[a-z_]+|insights|contradictions|action_plan)$/);
      if (a.match) expect(() => new RegExp(a.match!, 'i')).not.toThrow();
      if (a.band) expect(a.band[0]).toBeLessThanOrEqual(a.band[1]);
      if (a.target === 'readiness' || a.target.startsWith('sub_score:')) expect(a.band).toBeDefined();
      if (a.target === 'archetype') expect(a.one_of ?? a.match).toBeDefined();
      if (a.rank) expect(a.target).toBe('strategy');
    };
    expect(p.must_include.length).toBeGreaterThan(0);
    p.must_include.forEach(check);
    p.must_exclude.forEach(check);
  });

  it('I is a twin of A on every capacity input and differs only in preferences', () => {
    const a = loadPersona('A');
    const i = loadPersona('I');
    const diffs: string[] = [];
    for (const type of AUDIT_TYPES) {
      for (const [section, fields] of Object.entries(a.audits[type])) {
        for (const field of Object.keys(fields)) {
          if (fields[field] !== i.audits[type][section]?.[field]) diffs.push(`${type}.${section}.${field}`);
        }
      }
    }
    expect(diffs.sort()).toEqual(
      [
        'horizon.constraints.deal_breakers',
        'horizon.constraints.geographic_constraints',
        'horizon.constraints.property_type_preference',
        'horizon.lifestyle.house_hacking',
        'horizon.objectives.primary_objective',
        'horizon.objectives.secondary_objective',
        'risk.comfort_zones.out_of_state',
        'time.flexibility.travel_willingness',
        'time.preferences.hands_on_preference',
        'time.preferences.management_style',
      ].sort(),
    );
    // The diagnostic pair: same money, same hours, same risk self-rating, same horizon
    expect(i.audits.financial.assets.liquid_cash).toBe(a.audits.financial.assets.liquid_cash);
    expect(i.audits.time.availability.re_hours_per_week).toBe(a.audits.time.availability.re_hours_per_week);
    expect(i.audits.risk.self_assessment.risk_tolerance_self).toBe(a.audits.risk.self_assessment.risk_tolerance_self);
    expect(i.audits.horizon.timeline.financial_freedom_timeline).toBe(a.audits.horizon.timeline.financial_freedom_timeline);
  });
});
