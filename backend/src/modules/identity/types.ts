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
}

/**
 * Zod schema for runtime validation of the AI synthesis response.
 */
export const AiSynthesisResponseSchema = z.object({
  archetype: z.string().min(1).max(100),
  headline_insight: z.string().min(1).max(2000),
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
