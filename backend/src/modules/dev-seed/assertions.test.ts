import { evaluateFixture, summarizeResults, type EvalOutput } from './assertions';
import { loadPersona } from './fixtures';

const identity = {
  archetype: 'House Hacker',
  readiness_score: 42,
  sub_scores: { financial: 40, time: 60, skills: 20, risk: 55, horizon: 50 },
  headline_insight: 'Your 12 hours a week and $45k are enough for an owner-occupied start.',
  ai_insights: { contradictions: ['Says aggressive but every scenario answer is conservative'], gaps: [] },
};

const good: EvalOutput = {
  identity,
  strategies: [
    { name: 'House Hack a Duplex', description: 'Buy a 2-4 unit with FHA, live in one.', rank: 1 },
    { name: 'Turnkey Rental', description: 'A managed single family.', rank: 2 },
    { name: 'Private Lending', description: 'Lend to a local rehabber.', rank: 3 },
  ],
  action_plan: null,
};

describe('evaluateFixture', () => {
  it('passes persona A on an oracle answer and skips what needs activation', () => {
    const results = evaluateFixture(loadPersona('A'), good);
    expect(results.filter((r) => r.status === 'fail')).toEqual([]);
    const s = summarizeResults(results);
    expect(s.passed + s.skipped).toBe(s.total);
  });

  it('fails the include and the exclude when the strategies are wrong for A', () => {
    const bad: EvalOutput = {
      ...good,
      strategies: [
        { name: 'Fix and Flip', description: 'Flip houses for profit.', rank: 1 },
        { name: 'Save More First', description: 'Save more money before investing.', rank: 2 },
        { name: 'Syndication', description: 'Invest as an LP.', rank: 3 },
      ],
    };
    const results = evaluateFixture(loadPersona('A'), bad);
    const failed = results.filter((r) => r.status === 'fail').map((r) => `${r.kind}:${r.assertion.target}`);
    expect(failed).toEqual(expect.arrayContaining(['include:strategy', 'exclude:strategy']));
  });

  it('respects rank on an exclude (G: turnkey is fine, just not as #1)', () => {
    const g = loadPersona('G');
    const turnkeySecond: EvalOutput = {
      ...good,
      identity: { ...identity, archetype: 'Value-Add Operator', readiness_score: 60 },
      strategies: [
        { name: 'BRRRR into Multifamily', description: 'Phase one value-add, then scale.', rank: 1 },
        { name: 'Turnkey Rentals', description: 'Managed doors out of state.', rank: 2 },
        { name: 'Short-Term Rental', description: 'One STR in a vacation market.', rank: 3 },
      ],
    };
    expect(evaluateFixture(g, turnkeySecond).filter((r) => r.status === 'fail')).toEqual([]);
    const turnkeyFirst: EvalOutput = {
      ...turnkeySecond,
      strategies: turnkeySecond.strategies.map((s) => ({ ...s, rank: s.rank === 1 ? 2 : s.rank === 2 ? 1 : s.rank })),
    };
    expect(evaluateFixture(g, turnkeyFirst).some((r) => r.status === 'fail' && r.kind === 'exclude')).toBe(true);
  });

  it('bands and set membership fail on the wrong values', () => {
    const results = evaluateFixture(loadPersona('A'), {
      ...good,
      identity: { ...identity, archetype: 'Portfolio Scaler', readiness_score: 90 },
    });
    const failed = results.filter((r) => r.status === 'fail').map((r) => r.assertion.target);
    expect(failed).toEqual(expect.arrayContaining(['archetype', 'readiness']));
  });

  it('passes no include on an empty answer (identity checks skip, strategy checks fail)', () => {
    const results = evaluateFixture(loadPersona('H'), { identity: null, strategies: [], action_plan: null });
    expect(results.filter((r) => r.kind === 'include').every((r) => r.status !== 'pass')).toBe(true);
    expect(results.some((r) => r.status === 'fail')).toBe(true);
  });
});
