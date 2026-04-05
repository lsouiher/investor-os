import { z } from 'zod';

export interface ActionItem {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  is_completed: boolean;
  completed_at: string | null;
}

export interface ActionPlanJson {
  items: ActionItem[];
}

export interface Milestone {
  id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  sort_order: number;
  is_completed: boolean;
  completed_at: string | null;
}

export interface RoadmapJson {
  milestones: Milestone[];
}

export interface MicroTask {
  id: string;
  title: string;
  description: string | null;
  estimated_minutes: number | null;
  sort_order: number;
  is_completed: boolean;
  completed_at: string | null;
}

export interface MicroPlanJson {
  expires_at: string;
  tasks: MicroTask[];
}

export interface StrategySummary {
  id: string;
  name: string;
  description: string;
  fitScore: number;
  pros: string[];
  cons: string[];
  rank: number;
  isActive: boolean;
  actionPlan: { itemCount: number; completedCount: number } | null;
  roadmap: { milestoneCount: number; completedCount: number } | null;
  microPlan: { taskCount: number; completedCount: number; expiresAt: string | null } | null;
}

/**
 * Shape of the AI strategy generation response.
 */
export interface AiStrategyResponse {
  strategies: Array<{
    name: string;
    description: string;
    fit_score: number;
    pros: string[];
    cons: string[];
    rank: number;
  }>;
}

/**
 * Zod schema for runtime validation of the AI strategy generation response.
 */
export const AiStrategyResponseSchema = z.object({
  strategies: z.array(
    z.object({
      name: z.string().min(1).max(200),
      description: z.string().min(1).max(2000),
      fit_score: z.number().min(0).max(100),
      pros: z.array(z.string().max(1000)),
      cons: z.array(z.string().max(1000)),
      rank: z.number().int().min(1).max(3),
    }),
  ).min(1).max(5),
});

/**
 * Shape of the AI action plan / roadmap / micro-plan generation response (Call 2).
 */
export interface AiActivationResponse {
  action_plan: {
    items: Array<{
      title: string;
      description: string | null;
    }>;
  };
  roadmap: {
    milestones: Array<{
      title: string;
      description: string | null;
      target_date: string | null;
    }>;
  };
  micro_plan: {
    tasks: Array<{
      title: string;
      description: string | null;
      estimated_minutes: number | null;
    }>;
  };
}

/**
 * Zod schema for runtime validation of the AI activation response (Call 2).
 */
export const AiActivationResponseSchema = z.object({
  action_plan: z.object({
    items: z.array(
      z.object({
        title: z.string().min(1).max(500),
        description: z.string().max(2000).nullable(),
      }),
    ).min(1),
  }),
  roadmap: z.object({
    milestones: z.array(
      z.object({
        title: z.string().min(1).max(500),
        description: z.string().max(2000).nullable(),
        target_date: z.string().max(100).nullable(),
      }),
    ).min(1),
  }),
  micro_plan: z.object({
    tasks: z.array(
      z.object({
        title: z.string().min(1).max(500),
        description: z.string().max(2000).nullable(),
        estimated_minutes: z.number().int().min(1).max(480).nullable(),
      }),
    ).min(1),
  }),
});
