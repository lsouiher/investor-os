import { z } from 'zod';

export interface IdentitySummary {
  id: string;
  version: number;
  archetype: string;
  readinessScore: number;
  subScores: Record<string, number>;
  radarData: Record<string, number>;
  headlineInsight: string;
  generatedAt: string;
}

export interface IdentityDetail {
  id: string;
  version: number;
  archetype: string;
  readinessScore: number;
  subScores: Record<string, number>;
  radarData: Record<string, number>;
  headlineInsight: string;
  aiInsights: Record<string, unknown>;
  generatedAt: string;
  userRating: number | null;
}

/**
 * Zod schema for runtime validation of the AI synthesis response.
 */
// A 0-100 judgment the model may return; anything unusable is dropped and the deterministic
// fallback applies, so a thin or malformed number never fails a synthesis.
const score = z.preprocess(
  (v) => (typeof v === 'string' ? Number(v) : v),
  z.number().finite().min(0).max(100).transform(Math.round).optional().catch(undefined),
);

export const AiSynthesisResponseSchema = z.object({
  archetype: z.string().min(1).max(100),
  headline_insight: z.string().min(1).max(2000),
  // Substance-based readiness assessed by the model against the rubric in the prompt.
  // The deterministic numbers passed in are completeness only and would read 100 for anyone
  // who filled in every field, which is not a readiness score.
  readiness_score: score,
  sub_scores: z
    .object({ financial: score, time: score, skills: score, risk: score, horizon: score })
    .partial()
    .optional()
    .catch(undefined),
  radar_data: z
    .object({ capital: score, time: score, skills: score, risk_tolerance: score, network: score, goal_clarity: score })
    .partial()
    .optional()
    .catch(undefined),
  // Key name matches the identity_synthesis prompt template; sub-fields are lenient
  // because the model may omit sections for thin profiles.
  ai_insights: z
    .object({
      contradictions: z.array(z.string().max(2000)).default([]),
      feasibility: z.record(z.string(), z.unknown()).default({}),
      gaps: z.array(z.string().max(2000)).default([]),
      strengths: z.array(z.string().max(2000)).default([]),
      recommendations: z.array(z.string().max(2000)).default([]),
    })
    .default({ contradictions: [], feasibility: {}, gaps: [], strengths: [], recommendations: [] }),
});

export type AiSynthesisResponse = z.infer<typeof AiSynthesisResponseSchema>;
