import { z } from 'zod';
import { AppError } from '../../shared/middleware/error-handler.js';
import { callClaudeWithRetry, parseJsonResponse } from '../../shared/ai/retry.js';
import { loadActiveTemplate, assemblePrompt } from '../../shared/ai/prompt-loader.js';
import { prisma } from '../../shared/db.js';

export type InsightType = 'progress' | 'contradiction' | 'score_change' | 'milestone' | 'network_alert';

export interface Insight {
  type: InsightType;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'success';
  actionUrl?: string;
}

/**
 * Zod schema for runtime validation of the AI insight response.
 */
// Keys match the insight prompt template's JSON output format
const InsightResponseSchema = z.object({
  insights: z.array(
    z.object({
      type: z.enum(['progress', 'contradiction', 'score_change', 'milestone', 'network_alert']),
      title: z.string().min(1).max(200),
      message: z.string().min(1).max(2000),
      severity: z.enum(['info', 'warning', 'success']),
      action_url: z.string().max(500).startsWith('/').nullable().optional(),
    }),
  ).max(10),
});

interface InsightContext {
  identity: {
    archetype: string;
    readinessScore: number;
    subScores: unknown;
    radarData: unknown;
    headlineInsight: string;
  } | null;
  activeStrategy: {
    name: string;
    fitScore: number;
    actionPlan: unknown;
    roadmap: unknown;
  } | null;
  taskStats: {
    total: number;
    completed: number;
    overdue: number;
  };
  contactStats: {
    total: number;
    rolesCovered: string[];
  };
}

export async function generateInsights(userId: number, tenantId: number): Promise<Insight[]> {
  // Gather context
  const context = await gatherInsightContext(userId, tenantId);

  if (!context.identity) {
    // No identity yet — return a simple nudge
    return [{
      type: 'progress',
      title: 'Get Started',
      message: 'Complete all 5 audits to unlock your investor identity and personalized insights.',
      severity: 'info',
      actionUrl: '/audits',
    }];
  }

  // Load prompt template and call AI
  const template = await loadActiveTemplate('insight');
  const prompt = assemblePrompt(template.templateContent, {
    CONTEXT: JSON.stringify(
      {
        archetype: context.identity.archetype,
        readiness_score: context.identity.readinessScore,
        sub_scores: context.identity.subScores,
        radar_data: context.identity.radarData,
        active_strategy: context.activeStrategy ?? 'None selected',
        task_stats: context.taskStats,
        contact_stats: context.contactStats,
      },
      null,
      2,
    ),
  });

  const aiResult = await callClaudeWithRetry({
    tenantId,
    userId,
    serviceType: 'insight',
    promptTemplateId: template.id,
    systemPrompt: 'You are an expert real estate investment advisor. Generate personalized, actionable insights based on the investor context provided. Respond with valid JSON only.',
    userContent: prompt,
  });

  const parsed = parseJsonResponse(aiResult.content, InsightResponseSchema);

  return parsed.insights
    .map((i): Insight => ({
      type: i.type,
      title: i.title,
      message: i.message,
      severity: i.severity,
      actionUrl: i.action_url ?? undefined,
    }))
    .slice(0, 10); // Cap at 10 insights
}

async function gatherInsightContext(userId: number, tenantId: number): Promise<InsightContext> {
  const [identity, activeStrategy, taskStats, contacts] = await Promise.all([
    prisma.identityVersion.findFirst({
      where: { userId, tenantId },
      orderBy: { version: 'desc' },
    }),
    prisma.strategy.findFirst({
      where: { userId, tenantId, isActive: true },
    }),
    getTaskStats(userId, tenantId),
    prisma.contact.findMany({
      where: { userId, tenantId, deletedAt: null },
      select: { roleType: true },
    }),
  ]);

  return {
    identity: identity
      ? {
          archetype: identity.archetype,
          readinessScore: identity.readinessScore,
          subScores: identity.subScores,
          radarData: identity.radarData,
          headlineInsight: identity.headlineInsight,
        }
      : null,
    activeStrategy: activeStrategy
      ? {
          name: activeStrategy.name,
          fitScore: activeStrategy.fitScore,
          actionPlan: activeStrategy.actionPlan,
          roadmap: activeStrategy.roadmap,
        }
      : null,
    taskStats,
    contactStats: {
      total: contacts.length,
      rolesCovered: [...new Set(contacts.map((c) => c.roleType))],
    },
  };
}

async function getTaskStats(userId: number, tenantId: number) {
  const now = new Date();
  const [total, completed, overdue] = await Promise.all([
    prisma.task.count({ where: { userId, tenantId, deletedAt: null } }),
    prisma.task.count({ where: { userId, tenantId, deletedAt: null, isCompleted: true } }),
    prisma.task.count({
      where: {
        userId,
        tenantId,
        deletedAt: null,
        isCompleted: false,
        dueDate: { lt: now },
      },
    }),
  ]);

  return { total, completed, overdue };
}
