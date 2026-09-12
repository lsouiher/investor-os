/**
 * Contract tests: every Zod schema must accept the JSON shape its prompt template asks the
 * model for (prisma/seed.ts + growth OUTPUT_FORMATS). A mismatch here means the real model
 * returns "valid" JSON that the service then rejects — the bug that broke synthesis in v0.1.
 *
 * The sample objects below are the template-shaped responses served by scripts/mock-anthropic.mjs.
 */
jest.mock('../db.js', () => ({ prisma: {} }));
jest.mock('../../shared/db.js', () => ({ prisma: {} }));

import { AiSynthesisResponseSchema } from '../../modules/identity/types';
import { AiStrategyResponseSchema, AiActivationResponseSchema } from '../../modules/strategy/types';
import { SimulationResultSchema } from '../../modules/simulation/service';
import { InsightResponseSchema } from '../../modules/insight/service';
import { PathGenerationResponseSchema, CrossPathAnalysisResponseSchema } from '../../modules/growth/generation';

describe('AI response schemas match their prompt templates', () => {
  it('identity_synthesis: ai_insights key, lenient sub-fields', () => {
    const full = AiSynthesisResponseSchema.safeParse({
      archetype: 'Cash Flow Hunter',
      readiness_score: 74,
      sub_scores: { financial: 78 },
      radar_data: { capital: 72 },
      headline_insight: 'Strong capital, thin network.',
      ai_insights: { contradictions: [], feasibility: {}, gaps: ['x'], strengths: [], recommendations: [] },
    });
    expect(full.success).toBe(true);

    // The model may omit sections for thin profiles
    const minimal = AiSynthesisResponseSchema.safeParse({
      archetype: 'Cash Flow Hunter',
      headline_insight: 'x',
    });
    expect(minimal.success).toBe(true);
    expect(minimal.success && minimal.data.ai_insights.gaps).toEqual([]);
  });

  it('strategy_generation: three ranked strategies', () => {
    const res = AiStrategyResponseSchema.safeParse({
      strategies: [1, 2, 3].map((rank) => ({
        name: `S${rank}`,
        description: 'd',
        fit_score: 90 - rank,
        pros: ['a'],
        cons: ['b'],
        rank,
      })),
    });
    expect(res.success).toBe(true);
  });

  it('strategy_activation: action_plan / roadmap / micro_plan', () => {
    const res = AiActivationResponseSchema.safeParse({
      action_plan: { items: [{ title: 'Define buy box', description: null }] },
      roadmap: { milestones: [{ title: 'Financing secured', description: null, target_date: '2026-11-01T00:00:00Z' }] },
      micro_plan: { tasks: [{ title: 'Pull credit report', description: null, estimated_minutes: 15 }] },
    });
    expect(res.success).toBe(true);
  });

  it('simulation: snake_case keys, strategy_changes as string or list', () => {
    const asString = SimulationResultSchema.safeParse({
      archetype: 'Operator',
      readiness_score: 81,
      sub_scores: { financial: 88 },
      radar_data: { capital: 85 },
      headline_insight: 'x',
      strategy_changes: '1 of 3 strategies would change',
    });
    expect(asString.success).toBe(true);
    const asList = SimulationResultSchema.safeParse({ archetype: 'Operator', readiness_score: 81, strategy_changes: ['a'] });
    expect(asList.success).toBe(true);
  });

  it('insight: type/title/message/severity/action_url', () => {
    const res = InsightResponseSchema.safeParse({
      insights: [
        { type: 'network_alert', title: 'Lender gap', message: 'm', severity: 'warning', action_url: '/contacts' },
        { type: 'progress', title: 'Momentum', message: 'm', severity: 'success', action_url: null },
      ],
    });
    expect(res.success).toBe(true);
    // action_url must be a relative app path (never an external/javascript: URL)
    const bad = InsightResponseSchema.safeParse({
      insights: [{ type: 'progress', title: 't', message: 'm', severity: 'info', action_url: 'javascript:alert(1)' }],
    });
    expect(bad.success).toBe(false);
  });

  it('growth_path_generation: content + action_items + summary', () => {
    const res = PathGenerationResponseSchema.safeParse({
      content: { scaling_plan: { year_1_vision: '1 duplex' } },
      action_items: [{ title: 'Close first deal', description: 'd', timeframe: '6-12 months', category: 'acquisition', identity_impact: 'x', priority_score: 95 }],
      summary: 's',
    });
    expect(res.success).toBe(true);
  });

  it('cross_path_analysis: links + next_best_action', () => {
    const res = CrossPathAnalysisResponseSchema.safeParse({
      links: [
        {
          type: 'prerequisite',
          source_path_type: 'income_capital',
          source_description: 'Reserve fund',
          target_path_type: 'portfolio',
          target_description: 'Close first deal',
          description: 'Reserves first.',
          resolution: null,
        },
      ],
      next_best_action: { path_type: 'portfolio', title: 't', reason: 'r', cross_path_impact: ['portfolio'] },
    });
    expect(res.success).toBe(true);
  });
});
