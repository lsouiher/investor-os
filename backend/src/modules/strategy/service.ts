import * as strategyRepo from './repository.js';
import * as identityRepo from '../identity/repository.js';
import { loadActiveTemplate, assemblePrompt } from '../../shared/ai/prompt-loader.js';
import { callClaudeWithRetry, parseJsonResponse } from '../../shared/ai/retry.js';
import { generatePublicId } from '../../shared/utils/id.js';
import { AppError } from '../../shared/middleware/error-handler.js';
import { logger } from '../../shared/logger.js';
import type {
  StrategySummary,
  AiStrategyResponse,
  AiActivationResponse,
  ActionPlanJson,
  RoadmapJson,
  MicroPlanJson,
  ActionItem,
  Milestone,
  MicroTask,
} from './types.js';
import { AiStrategyResponseSchema, AiActivationResponseSchema } from './types.js';

/**
 * Get all strategies for the current user, formatted for API response.
 */
type StrategyRow = Awaited<ReturnType<typeof strategyRepo.getStrategiesByUser>>[number];

function formatStrategy(s: StrategyRow): StrategySummary {
  const actionPlan = s.actionPlan as unknown as ActionPlanJson | null;
  const roadmap = s.roadmap as unknown as RoadmapJson | null;
  const microPlan = s.microPlan as unknown as MicroPlanJson | null;

  return {
    id: s.publicId,
    name: s.name,
    description: s.description,
    fitScore: s.fitScore,
    pros: s.pros as unknown as string[],
    cons: s.cons as unknown as string[],
    rank: s.rank,
    isActive: s.isActive,
    actionPlan: actionPlan
      ? {
          itemCount: actionPlan.items.length,
          completedCount: actionPlan.items.filter((i) => i.is_completed).length,
        }
      : null,
    roadmap: roadmap
      ? {
          milestoneCount: roadmap.milestones.length,
          completedCount: roadmap.milestones.filter((m) => m.is_completed).length,
        }
      : null,
    microPlan: microPlan
      ? {
          taskCount: microPlan.tasks.length,
          completedCount: microPlan.tasks.filter((t) => t.is_completed).length,
          expiresAt: microPlan.expires_at,
        }
      : null,
  };
}

export async function getStrategies(
  userId: number,
  tenantId: number,
): Promise<StrategySummary[]> {
  // Recommendations belong to the current identity version. If none exist yet (first synthesis,
  // or the chained generation failed), generate them now so the page never dead-ends.
  const identity = await identityRepo.getLatestIdentity(userId, tenantId);
  if (!identity) return [];

  const strategies = await strategyRepo.getStrategiesByUser(userId, tenantId, identity.id);
  if (strategies.length === 0) {
    return generateStrategies(userId, tenantId);
  }
  return strategies.map(formatStrategy);
}

/**
 * Generate 3 strategy recommendations from the latest identity.
 * Calls AI (Call 1) to generate strategies, then stores them.
 */
export async function generateStrategies(
  userId: number,
  tenantId: number,
): Promise<StrategySummary[]> {
  // Get latest identity
  const identity = await identityRepo.getLatestIdentity(userId, tenantId);
  if (!identity) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Identity must be synthesized before generating strategies.',
      400,
    );
  }

  const template = await loadActiveTemplate('strategy_generation');

  // Placeholder names must match the strategy_generation template exactly (case-sensitive)
  const userContent = assemblePrompt(template.templateContent, {
    IDENTITY: JSON.stringify(
      {
        archetype: identity.archetype,
        readiness_score: identity.readinessScore,
        sub_scores: identity.subScores,
        radar_data: identity.radarData,
        headline_insight: identity.headlineInsight,
        ai_insights: identity.aiInsights,
      },
      null,
      2,
    ),
  });

  const aiResult = await callClaudeWithRetry({
    tenantId,
    userId,
    serviceType: 'strategy_generation',
    promptTemplateId: template.id,
    systemPrompt: `You are an expert real estate investment strategist. Based on the investor's identity profile, recommend exactly 3 investment strategies ranked by fit. Respond with valid JSON only.`,
    userContent,
    timeoutMs: 30000,
  });

  const parsed = parseJsonResponse<AiStrategyResponse>(aiResult.content, AiStrategyResponseSchema);

  if (!parsed.strategies || parsed.strategies.length !== 3) {
    throw new AppError(
      'AI_SERVICE_ERROR',
      'AI did not return exactly 3 strategies. Please try again.',
      503,
    );
  }

  // Store strategies
  const inputs = parsed.strategies.map((s) => ({
    tenantId,
    userId,
    identityVersionId: identity.id,
    name: s.name,
    description: s.description,
    fitScore: s.fit_score,
    pros: s.pros,
    cons: s.cons,
    rank: s.rank,
  }));

  await strategyRepo.createStrategies(inputs);

  logger.info(
    { userId, tenantId, identityVersion: identity.version },
    'Strategies generated',
  );

  const stored = await strategyRepo.getStrategiesByUser(userId, tenantId, identity.id);
  return stored.map(formatStrategy);
}

/**
 * Activate a strategy and trigger Call 2 for action plan, roadmap, and micro-plan.
 */
export async function activateStrategy(
  strategyPublicId: string,
  userId: number,
  tenantId: number,
): Promise<{ id: string; isActive: boolean }> {
  const strategy = await strategyRepo.getStrategyByPublicId(strategyPublicId, tenantId);
  if (!strategy) {
    throw new AppError('NOT_FOUND', 'Strategy not found.', 404);
  }

  if (strategy.userId !== userId) {
    throw new AppError('FORBIDDEN', 'You do not have access to this strategy.', 403);
  }

  // Activate
  const activated = await strategyRepo.activateStrategy(strategy.id, userId, tenantId);

  // Trigger Call 2 for detailed plans (async — don't block the response)
  generateDetailedPlans(strategy.id, userId, tenantId).catch((err) => {
    logger.error({ err, strategyId: strategy.id }, 'Failed to generate detailed plans');
  });

  return {
    id: activated.publicId,
    isActive: activated.isActive,
  };
}

/**
 * Generate action plan, roadmap, and micro-plan for an activated strategy (Call 2).
 */
async function generateDetailedPlans(
  strategyId: number,
  userId: number,
  tenantId: number,
): Promise<void> {
  const { prisma } = await import('../../shared/db.js');
  const fullStrategy = await prisma.strategy.findUnique({
    where: { id: strategyId },
    include: { identityVersion: true },
  });

  if (!fullStrategy) return;

  const template = await loadActiveTemplate('strategy_activation');
  const identity = fullStrategy.identityVersion;

  const userContent = assemblePrompt(template.templateContent, {
    STRATEGY_NAME: fullStrategy.name,
    STRATEGY_DESCRIPTION: fullStrategy.description,
    ARCHETYPE: identity.archetype,
    READINESS_SCORE: String(identity.readinessScore),
    SUB_SCORES: JSON.stringify(identity.subScores),
    RADAR_DATA: JSON.stringify(identity.radarData),
  });

  const aiResult = await callClaudeWithRetry({
    tenantId,
    userId,
    serviceType: 'strategy_activation',
    promptTemplateId: template.id,
    systemPrompt: `You are an expert real estate investment strategist. Generate a detailed action plan, roadmap with milestones, and a 72-hour micro-plan for this specific strategy. Respond with valid JSON only.`,
    userContent,
    timeoutMs: 45000,
  });

  const parsed = parseJsonResponse<AiActivationResponse>(aiResult.content, AiActivationResponseSchema);

  // Build JSONB structures with generated IDs
  const actionPlan: ActionPlanJson = {
    items: parsed.action_plan.items.map((item, idx): ActionItem => ({
      id: generatePublicId(),
      title: item.title,
      description: item.description,
      sort_order: idx + 1,
      is_completed: false,
      completed_at: null,
    })),
  };

  const roadmap: RoadmapJson = {
    milestones: parsed.roadmap.milestones.map((m, idx): Milestone => ({
      id: generatePublicId(),
      title: m.title,
      description: m.description,
      target_date: m.target_date,
      sort_order: idx + 1,
      is_completed: false,
      completed_at: null,
    })),
  };

  const microPlan: MicroPlanJson = {
    expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    tasks: parsed.micro_plan.tasks.map((t, idx): MicroTask => ({
      id: generatePublicId(),
      title: t.title,
      description: t.description,
      estimated_minutes: t.estimated_minutes,
      sort_order: idx + 1,
      is_completed: false,
      completed_at: null,
    })),
  };

  await strategyRepo.updateStrategyDetails(strategyId, { actionPlan, roadmap, microPlan });

  logger.info({ strategyId }, 'Detailed plans generated for strategy');
}

/**
 * Get action plan for a strategy.
 */
export async function getActionPlan(
  strategyPublicId: string,
  tenantId: number,
) {
  const strategy = await strategyRepo.getStrategyByPublicId(strategyPublicId, tenantId);
  if (!strategy) {
    throw new AppError('NOT_FOUND', 'Strategy not found.', 404);
  }

  if (!strategy.actionPlan) {
    return { items: [] };
  }

  return strategy.actionPlan as unknown as ActionPlanJson;
}

/**
 * Get roadmap for a strategy.
 */
export async function getRoadmap(
  strategyPublicId: string,
  tenantId: number,
) {
  const strategy = await strategyRepo.getStrategyByPublicId(strategyPublicId, tenantId);
  if (!strategy) {
    throw new AppError('NOT_FOUND', 'Strategy not found.', 404);
  }

  if (!strategy.roadmap) {
    return { milestones: [] };
  }

  return strategy.roadmap as unknown as RoadmapJson;
}

/**
 * Get micro-plan for a strategy.
 */
export async function getMicroPlan(
  strategyPublicId: string,
  tenantId: number,
) {
  const strategy = await strategyRepo.getStrategyByPublicId(strategyPublicId, tenantId);
  if (!strategy) {
    throw new AppError('NOT_FOUND', 'Strategy not found.', 404);
  }

  if (!strategy.microPlan) {
    return { expires_at: null, tasks: [] };
  }

  return strategy.microPlan as unknown as MicroPlanJson;
}

/**
 * Update completion status of an action item, milestone, or micro-task.
 */
export async function updateItemCompletion(
  itemType: 'action-item' | 'milestone' | 'micro-task',
  itemId: string,
  isCompleted: boolean,
  userId: number,
  tenantId: number,
): Promise<void> {
  // Find the strategy containing this item by scanning user strategies
  const strategies = await strategyRepo.getStrategiesByUser(userId, tenantId);

  for (const strategy of strategies) {
    let result = null;

    if (itemType === 'action-item' && strategy.actionPlan) {
      const plan = strategy.actionPlan as unknown as ActionPlanJson;
      if (plan.items.some((i) => i.id === itemId)) {
        result = await strategyRepo.updateActionItem(strategy.id, itemId, { is_completed: isCompleted });
      }
    } else if (itemType === 'milestone' && strategy.roadmap) {
      const roadmap = strategy.roadmap as unknown as RoadmapJson;
      if (roadmap.milestones.some((m) => m.id === itemId)) {
        result = await strategyRepo.updateMilestone(strategy.id, itemId, { is_completed: isCompleted });
      }
    } else if (itemType === 'micro-task' && strategy.microPlan) {
      const plan = strategy.microPlan as unknown as MicroPlanJson;
      if (plan.tasks.some((t) => t.id === itemId)) {
        result = await strategyRepo.updateMicroTask(strategy.id, itemId, { is_completed: isCompleted });
      }
    }

    if (result) {
      // Evaluate growth path unlocks after V1 task/action completion (fire-and-forget)
      try {
        const { evaluateUnlocks } = await import('../growth/service.js');
        await evaluateUnlocks(userId, tenantId);
      } catch (err) {
        logger.error({ err, userId }, 'Failed to evaluate growth unlocks (non-blocking)');
      }
      return;
    }
  }

  throw new AppError('NOT_FOUND', `${itemType} not found.`, 404);
}

/**
 * Check if strategies need refresh based on identity score delta.
 * Flags strategies when the readiness score changes by more than 10 points.
 */
export async function checkRefreshNeeded(
  userId: number,
  tenantId: number,
  previousScore: number,
  currentScore: number,
): Promise<boolean> {
  const delta = Math.abs(currentScore - previousScore);
  if (delta > 10) {
    await strategyRepo.flagStrategiesForRefresh(userId, tenantId);
    logger.info(
      { userId, delta, previousScore, currentScore },
      'Strategies flagged for refresh due to identity score shift',
    );
    return true;
  }
  return false;
}
