import { z } from 'zod';

export interface IdentitySummary {
  id: string;
  version: number;
  archetype: string;
  readinessScore: number;
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
 * Shape of the AI synthesis response we expect back from Claude.
 */
export interface AiSynthesisResponse {
  archetype: string;
  headline_insight: string;
  insights: {
    contradictions: string[];
    feasibility: Record<string, unknown>;
    gaps: string[];
    strengths: string[];
    recommendations: string[];
  };
}

/**
 * Zod schema for runtime validation of the AI synthesis response.
 */
export const AiSynthesisResponseSchema = z.object({
  archetype: z.string().min(1).max(100),
  headline_insight: z.string().min(1).max(2000),
  insights: z.object({
    contradictions: z.array(z.string().max(2000)),
    feasibility: z.record(z.string(), z.unknown()),
    gaps: z.array(z.string().max(2000)),
    strengths: z.array(z.string().max(2000)),
    recommendations: z.array(z.string().max(2000)),
  }),
});
