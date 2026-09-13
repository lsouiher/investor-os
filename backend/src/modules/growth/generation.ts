import { GrowthPathType, Prisma } from '@prisma/client';
import { z } from 'zod';
import { loadActiveTemplate, assemblePrompt } from '../../shared/ai/prompt-loader.js';
import { callClaudeWithRetry, parseJsonResponse } from '../../shared/ai/retry.js';
import { logger } from '../../shared/logger.js';
import { generatePublicId } from '../../shared/utils/id.js';
import * as growthRepo from './repository.js';
import * as identityRepo from '../identity/repository.js';
import { prisma } from '../../shared/db.js';

// --- Zod Schemas for AI Response Validation ---

const ActionItemSchema = z.object({
  title: z.string(),
  description: z.string().default(''),
  timeframe: z.string().default(''),
  category: z.string().default(''),
  identity_impact: z.string().default(''),
  priority_score: z.number().min(0).max(100).optional(),
});

export const PathGenerationResponseSchema = z.object({
  content: z.record(z.string(), z.unknown()),
  action_items: z.array(ActionItemSchema),
  summary: z.string(),
});

const CrossPathLinkSchema = z.object({
  type: z.enum(['prerequisite', 'enabling', 'constraint', 'conflict']),
  source_path_type: z.string(),
  source_item_id: z.string().optional().default(''),
  source_description: z.string(),
  target_path_type: z.string(),
  target_item_id: z.string().optional().default(''),
  target_description: z.string(),
  description: z.string(),
  resolution: z.string().nullable().default(null),
});

const NextBestActionSchema = z.object({
  action_item_id: z.string().optional().default(''),
  path_type: z.string(),
  title: z.string(),
  reason: z.string(),
  cross_path_impact: z.array(z.string()),
});

export const CrossPathAnalysisResponseSchema = z.object({
  links: z.array(CrossPathLinkSchema),
  next_best_action: NextBestActionSchema.nullable(),
});
import type {
  PathGenerationJobData,
  CrossPathAnalysisJobData,
  PathGenerationResponse,
  CrossPathAnalysisResponse,
  ActionItem,
  CrossPathLink,
  PortfolioContent,
  IncomeCapitalContent,
} from './types.js';

// Path-specific instructions injected into the prompt
const PATH_INSTRUCTIONS: Record<string, string> = {
  portfolio: `Generate a Portfolio Growth path with:
1. scaling_plan: { year_1_vision, year_3_vision, year_5_vision, year_10_vision }
2. reinvestment_strategy: detailed reinvestment approach
3. diversification_plan: how to diversify the portfolio
4. exit_framework: when and how to exit positions
5. financing_evolution: how financing strategy changes over time
6. tool_placeholders: array of {tool_name, stage, message} for future integrations

Generate 5-10 prioritized action items with timeframes and identity impact descriptions.`,

  income_capital: `Generate an Income & Capital Growth path with:
1. capital_acceleration_plan: strategy to accelerate capital accumulation
2. income_growth_roadmap: detailed plan for growing income
3. funding_channel_map: array of {channel, accessibility_rank, description, requirements} — identify user-specific capital sources
4. professional_transition_plan: plan for professional evolution (null if not applicable)
5. capital_milestone_targets: array of {milestone, target_amount, timeline, portfolio_phase_link}

Generate 5-10 prioritized action items with timeframes and identity impact descriptions.`,

  skills_knowledge: `Generate a Skills & Knowledge Growth path with:
1. skill_gap_analysis: array of {skill, current_level, target_level, priority_rank, portfolio_phase_link} — link gaps to portfolio milestones
2. learning_roadmap: structured learning plan
3. resource_recommendations: array of {type, name, url, relevance}
4. network_building_plan: strategy for building professional network
5. certification_roadmap: relevant certifications (null if not applicable)
6. mentorship_strategy: how to find and work with mentors

Generate 5-10 prioritized action items.`,

  time_operations: `Generate a Time & Operations Growth path with:
1. time_audit_reality_check: {stated_hours, estimated_actual_hours, gap_analysis} — reconcile stated vs actual hours
2. time_recapture_plan: strategy to reclaim time
3. delegation_roadmap: what and how to delegate
4. systems_and_tools_plan: systems to implement
5. active_to_passive_transition: plan for shifting to passive income
6. burnout_prevention: strategies to avoid burnout

Generate 5-10 prioritized action items.`,
};

// Output format for each path type
const OUTPUT_FORMATS: Record<string, string> = {
  portfolio: JSON.stringify({
    content: {
      scaling_plan: { year_1_vision: '', year_3_vision: '', year_5_vision: '', year_10_vision: '' },
      reinvestment_strategy: '',
      diversification_plan: '',
      exit_framework: '',
      financing_evolution: '',
      tool_placeholders: [{ tool_name: '', stage: '', message: '' }],
    },
    action_items: [{ title: '', description: '', timeframe: '', category: '', identity_impact: '', priority_score: 0 }],
    summary: '',
  }, null, 2),
  income_capital: JSON.stringify({
    content: {
      capital_acceleration_plan: '',
      income_growth_roadmap: '',
      funding_channel_map: [{ channel: '', accessibility_rank: 0, description: '', requirements: '' }],
      professional_transition_plan: null,
      capital_milestone_targets: [{ milestone: '', target_amount: '', timeline: '', portfolio_phase_link: '' }],
    },
    action_items: [{ title: '', description: '', timeframe: '', category: '', identity_impact: '', priority_score: 0 }],
    summary: '',
  }, null, 2),
  skills_knowledge: '{}',
  time_operations: '{}',
};

/**
 * Generate a growth path via AI.
 * Called by the Bull worker — NOT directly from routes.
 */
export async function generatePath(data: PathGenerationJobData): Promise<void> {
  const { tenantId, userId, growthPathId, pathType, identityVersionId, strategyId } = data;

  // 1. Load identity context
  const identity = await prisma.identityVersion.findFirst({
    where: { id: identityVersionId, tenantId },
  });
  if (!identity) throw new Error('Identity version not found');

  // 2. Load audit data for context (sub-scores and types only — never send raw responses
  // which may contain encrypted PII or sensitive financial data to the AI provider)
  const audits = await prisma.audit.findMany({
    where: { userId, tenantId, status: 'completed' },
    orderBy: { version: 'desc' },
    select: { auditType: true, subScore: true, version: true, status: true },
  });

  // 3. Load V1 strategy context (for Portfolio Growth)
  let strategyContext = 'No active V1 strategy.';
  if (strategyId) {
    const strategy = await prisma.strategy.findFirst({
      where: { id: strategyId, tenantId },
    });
    if (strategy) {
      strategyContext = JSON.stringify({
        name: strategy.name,
        description: strategy.description,
        fit_score: strategy.fitScore,
        action_plan: strategy.actionPlan,
        roadmap: strategy.roadmap,
        micro_plan: strategy.microPlan,
      }, null, 2);
    }
  }

  // 4. Load prior generated paths for context continuity
  const allPaths = await growthRepo.getAllCurrentPaths(data.growthStrategyId, tenantId);
  const generatedPaths = allPaths.filter((p) => p.status === 'generated' && p.pathType !== pathType);
  const priorPathsContext = generatedPaths.length > 0
    ? JSON.stringify(generatedPaths.map((p) => ({
        path_type: p.pathType,
        summary: p.summary,
        content: p.content,
      })), null, 2)
    : 'No prior paths generated yet.';

  // 5. Assemble prompt
  const template = await loadActiveTemplate('growth_path_generation');
  const identityContext = JSON.stringify({
    archetype: identity.archetype,
    readiness_score: identity.readinessScore,
    sub_scores: identity.subScores,
    radar_data: identity.radarData,
    headline_insight: identity.headlineInsight,
  }, null, 2);

  const auditContext = JSON.stringify(audits.map((a) => ({
    type: a.auditType,
    sub_score: a.subScore,
    version: a.version,
  })), null, 2);

  const userContent = assemblePrompt(template.templateContent, {
    PATH_TYPE: pathType,
    IDENTITY: identityContext,
    AUDIT_DATA: auditContext,
    STRATEGY_CONTEXT: strategyContext,
    PRIOR_PATHS: priorPathsContext,
    PATH_SPECIFIC_INSTRUCTIONS: PATH_INSTRUCTIONS[pathType] || '',
    OUTPUT_FORMAT: OUTPUT_FORMATS[pathType] || '{}',
  });

  // 6. Call AI
  const aiResult = await callClaudeWithRetry({
    tenantId,
    userId,
    serviceType: 'growth_path_generation',
    promptTemplateId: template.id,
    systemPrompt: 'You are an expert real estate growth strategist. Generate a comprehensive, personalized growth path based on the investor\'s identity and context. Respond with valid JSON only.',
    userContent,
    timeoutMs: 240_000,
  });

  // 7. Parse response
  const parsed = parseJsonResponse(aiResult.content, PathGenerationResponseSchema);

  // 8. Assign IDs to action items
  const actionItems: ActionItem[] = parsed.action_items.map((item, index) => ({
    ...item,
    id: generatePublicId(),
    priority_score: item.priority_score ?? (100 - index * 10),
    is_completed: false,
    completed_at: null,
  }));

  // 9. Update path with generated content
  await growthRepo.updatePathGenerated(
    growthPathId,
    tenantId,
    parsed.content as unknown as Prisma.InputJsonValue,
    actionItems as unknown as Prisma.InputJsonValue,
    parsed.summary,
  );

  // 10. Update strategy progress
  await recalculateStrategyProgress(data.growthStrategyId, tenantId);

  logger.info({ pathType, growthPathId, actionItemCount: actionItems.length }, 'Path generated successfully');
}

/**
 * Generate cross-path analysis via AI.
 * Called by the Bull worker after path generation.
 */
export async function generateCrossPathAnalysis(data: CrossPathAnalysisJobData): Promise<void> {
  const { tenantId, userId, growthStrategyId, identityVersionId } = data;

  // Load identity
  const identity = await prisma.identityVersion.findFirst({
    where: { id: identityVersionId, tenantId },
  });
  if (!identity) throw new Error('Identity version not found');

  // Load all generated paths
  const paths = await growthRepo.getAllCurrentPaths(growthStrategyId, tenantId);
  const generatedPaths = paths.filter((p) => p.status === 'generated');

  if (generatedPaths.length < 2) {
    logger.info({ growthStrategyId }, 'Less than 2 generated paths, skipping cross-path analysis');
    return;
  }

  // Assemble prompt
  const template = await loadActiveTemplate('cross_path_analysis');
  const identityContext = JSON.stringify({
    archetype: identity.archetype,
    readiness_score: identity.readinessScore,
  }, null, 2);

  const pathsContext = JSON.stringify(generatedPaths.map((p) => ({
    path_type: p.pathType,
    content: p.content,
    action_items: p.actionItems,
    summary: p.summary,
  })), null, 2);

  const userContent = assemblePrompt(template.templateContent, {
    IDENTITY: identityContext,
    PATHS: pathsContext,
  });

  const aiResult = await callClaudeWithRetry({
    tenantId,
    userId,
    serviceType: 'cross_path_analysis',
    promptTemplateId: template.id,
    systemPrompt: 'You are analyzing connections between an investor\'s growth paths. Identify cross-path dependencies, conflicts, and the single most impactful next action. Respond with valid JSON only.',
    userContent,
    timeoutMs: 120_000,
  });

  const parsed = parseJsonResponse(aiResult.content, CrossPathAnalysisResponseSchema);

  // Assign IDs to links
  const links: CrossPathLink[] = parsed.links.map((link) => ({
    ...link,
    id: generatePublicId(),
    source_path_type: link.source_path_type as GrowthPathType,
    target_path_type: link.target_path_type as GrowthPathType,
  }));

  const nextBestAction = parsed.next_best_action ? {
    action_item_id: parsed.next_best_action.action_item_id || '',
    path_type: parsed.next_best_action.path_type as GrowthPathType,
    title: parsed.next_best_action.title,
    reason: parsed.next_best_action.reason,
    cross_path_impact: parsed.next_best_action.cross_path_impact,
  } : null;

  await growthRepo.updateCrossPathLinks(growthStrategyId, links, nextBestAction);

  logger.info({ growthStrategyId, linkCount: links.length }, 'Cross-path analysis completed');
}

/**
 * Recalculate overall strategy progress and growth score.
 * Portfolio 50%, Income 50% per CEO review MVP weights.
 */
export async function recalculateStrategyProgress(
  growthStrategyId: number,
  tenantId: number,
): Promise<void> {
  const paths = await growthRepo.getAllCurrentPaths(growthStrategyId, tenantId);
  const generatedPaths = paths.filter((p) => p.status === 'generated');

  if (generatedPaths.length === 0) {
    await growthRepo.updateGrowthStrategyProgress(growthStrategyId, tenantId, 0, 0);
    return;
  }

  // Weighted average: Portfolio 50%, Income 50% (MVP weights per CEO review)
  const weights: Record<string, number> = {
    portfolio: 50,
    income_capital: 50,
    skills_knowledge: 0, // Stubs — no weight for MVP
    time_operations: 0,
  };

  let totalWeight = 0;
  let weightedProgress = 0;

  for (const path of generatedPaths) {
    const weight = weights[path.pathType] || 0;
    weightedProgress += path.progress * weight;
    totalWeight += weight;
  }

  const overallProgress = totalWeight > 0 ? Math.round(weightedProgress / totalWeight) : 0;
  const growthScore = overallProgress; // Growth score mirrors overall progress for MVP

  await growthRepo.updateGrowthStrategyProgress(growthStrategyId, tenantId, overallProgress, growthScore);
}
