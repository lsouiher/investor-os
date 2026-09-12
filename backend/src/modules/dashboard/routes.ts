import { Router, Request, Response, NextFunction } from 'express';
import * as auditRepo from '../audit/repository.js';
import * as identityRepo from '../identity/repository.js';
import * as strategyRepo from '../strategy/repository.js';
import * as taskService from '../task/service.js';
import { generateInsights } from '../insight/service.js';

const router = Router();

const AUDIT_TYPES = ['financial', 'time', 'skills', 'risk', 'horizon'] as const;

// GET /dashboard — aggregated dashboard data
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;

    const [
      identity,
      scoreHistory,
      activeStrategy,
      topTasks,
      auditSummaries,
      insights,
    ] = await Promise.all([
      // Latest identity snapshot
      identityRepo.getLatestIdentity(userId, tenantId),

      // Score trend (oldest -> newest) for the sparkline
      identityRepo.getIdentityHistory(userId, tenantId).then((h) => h.map((v) => v.readinessScore).reverse()),

      // Active strategy with progress
      strategyRepo.getActiveStrategy(userId, tenantId),

      // Top incomplete tasks by identity impact (manual + active strategy action items)
      taskService.listTasks(userId, tenantId, {
        isCompleted: false,
        page: 1,
        perPage: 10,
      }),

      // Audit completion status
      getAuditCompletion(userId, tenantId),

      // Intelligence feed
      generateInsights(userId, tenantId).catch(() => []),
    ]);

    // Calculate strategy progress
    let strategyProgress = null;
    if (activeStrategy?.actionPlan) {
      const plan = activeStrategy.actionPlan as { items?: Array<{ is_completed?: boolean }> };
      if (plan.items && Array.isArray(plan.items)) {
        const total = plan.items.length;
        const completed = plan.items.filter((i) => i.is_completed).length;
        strategyProgress = { total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
      }
    }

    // Growth strategy summary (conditional on feature flag)
    let growthStrategySummary = null;
    try {
      const { prisma } = await import('../../shared/db.js');
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { featureFlags: true },
      });
      const flags = (tenant?.featureFlags ?? {}) as Record<string, unknown>;
      if (flags.growth_strategy_enabled) {
        const { getGrowthStrategy, getRefreshSuggestions } = await import('../growth/service.js');
        const gs = await getGrowthStrategy(userId, tenantId);
        if (gs) {
          const stalePathNames = await getRefreshSuggestions(userId, tenantId);
          growthStrategySummary = {
            id: gs.id,
            overall_progress: gs.overall_progress,
            growth_score: gs.growth_score,
            paths: gs.paths.map((p) => ({
              path_type: p.path_type,
              status: p.status,
              progress: p.progress,
              summary: p.summary,
            })),
            next_best_action: gs.next_best_action,
            export_is_stale: gs.export_staleness.is_stale,
            refresh_suggestions: stalePathNames,
          };
        }
      }
    } catch { /* growth module not available or feature flag off — skip silently */ }

    res.json({
      data: {
        identity: identity
          ? {
              id: identity.publicId,
              archetype: identity.archetype,
              readinessScore: identity.readinessScore,
              subScores: identity.subScores,
              radarData: identity.radarData,
              headlineInsight: identity.headlineInsight,
              version: identity.version,
              generatedAt: identity.generatedAt.toISOString(),
              scoreHistory,
            }
          : null,
        activeStrategy: activeStrategy
          ? {
              id: activeStrategy.publicId,
              name: activeStrategy.name,
              description: activeStrategy.description,
              fitScore: activeStrategy.fitScore,
              needsRefresh: activeStrategy.needsRefresh,
              progress: strategyProgress,
            }
          : null,
        topTasks: topTasks.tasks.slice(0, 3).map((t) => ({
          id: t.id,
          source: t.source,
          title: t.title,
          description: t.description,
          identityImpactScore: t.identityImpactScore,
          dueDate: t.dueDate,
          strategyId: t.strategyId ?? null,
        })),
        intelligenceFeed: insights,
        auditCompletion: auditSummaries,
        growthStrategy: growthStrategySummary,
      },
    });
  } catch (err) {
    next(err);
  }
});

async function getAuditCompletion(userId: number, tenantId: number) {
  const audits = await auditRepo.getLatestAuditsByUser(userId, tenantId);

  // Build a map from the already-deduplicated results
  const latestByType = new Map(audits.map((a) => [a.auditType, a]));

  const items = AUDIT_TYPES.map((type) => {
    const audit = latestByType.get(type);
    return {
      auditType: type,
      status: audit?.status ?? 'not_started',
      version: audit?.version ?? 0,
      subScore: audit?.subScore ?? null,
      completedAt: audit?.completedAt?.toISOString() ?? null,
    };
  });

  const completedCount = items.filter((i) => i.status === 'completed').length;

  return {
    items,
    completedCount,
    totalRequired: AUDIT_TYPES.length,
    allComplete: completedCount === AUDIT_TYPES.length,
  };
}

export default router;
