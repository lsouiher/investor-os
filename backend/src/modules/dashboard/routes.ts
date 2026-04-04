import { Router, Request, Response, NextFunction } from 'express';
import * as auditRepo from '../audit/repository.js';
import * as identityRepo from '../identity/repository.js';
import * as strategyRepo from '../strategy/repository.js';
import * as taskRepo from '../task/repository.js';
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
      activeStrategy,
      topTasks,
      auditSummaries,
      insights,
    ] = await Promise.all([
      // Latest identity snapshot
      identityRepo.getLatestIdentity(userId, tenantId),

      // Active strategy with progress
      strategyRepo.getActiveStrategy(userId, tenantId),

      // Top 3 incomplete tasks
      taskRepo.listTasks(userId, tenantId, {
        isCompleted: false,
        page: 1,
        perPage: 3,
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
        topTasks: topTasks.tasks.map((t) => ({
          id: t.publicId,
          source: t.source,
          title: t.title,
          description: t.description,
          identityImpactScore: t.identityImpactScore,
          dueDate: t.dueDate?.toISOString() ?? null,
        })),
        intelligenceFeed: insights,
        auditCompletion: auditSummaries,
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
