import { Router, Request, Response, NextFunction } from 'express';
import { GrowthPathType } from '@prisma/client';
import { requireFeatureFlag } from '../../shared/middleware/featureFlag.js';
import { AppError } from '../../shared/middleware/error-handler.js';
import { requireRole } from '../../shared/middleware/rbac.js';
import { logger } from '../../shared/logger.js';
import * as growthService from './service.js';
import * as migration from './migration.js';
import * as exportModule from './export.js';
import * as growthRepo from './repository.js';

const router = Router();

// All growth strategy endpoints require the feature flag
router.use(requireFeatureFlag('growth_strategy_enabled'));

const VALID_PATH_TYPES = new Set<string>(['portfolio', 'income_capital', 'skills_knowledge', 'time_operations']);

function validatePathType(value: string): GrowthPathType {
  if (!VALID_PATH_TYPES.has(value)) {
    throw new AppError('VALIDATION_ERROR', `Invalid path type: ${value}. Must be one of: portfolio, income_capital, skills_knowledge, time_operations`, 400);
  }
  return value as GrowthPathType;
}

// --- Growth Strategy ---

// POST /growth-strategy — create growth strategy
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, tenantId } = req.user!;

    // Validate user has completed identity
    const { prisma } = await import('../../shared/db.js');
    const identity = await prisma.identityVersion.findFirst({
      where: { userId, tenantId },
      orderBy: { version: 'desc' },
    });

    if (!identity) {
      throw new AppError('VALIDATION_ERROR', 'Complete your investor identity before creating a growth strategy.', 400);
    }

    const { strategyId, portfolioPathId } = await growthService.createGrowthStrategy(userId, tenantId, identity.id);

    // Enqueue Portfolio generation
    const { pathGenerationQueue } = await import('../../workers/growth-path-worker.js');
    const activeV1Strategy = await prisma.strategy.findFirst({
      where: { userId, tenantId, isActive: true },
      select: { id: true },
    });

    try {
      await pathGenerationQueue.add({
        tenantId,
        userId,
        growthStrategyId: strategyId,
        growthPathId: portfolioPathId,
        pathType: 'portfolio',
        identityVersionId: identity.id,
        strategyId: activeV1Strategy?.id ?? null,
      });

      const { setPathGenerating } = await import('./repository.js');
      await setPathGenerating(portfolioPathId, tenantId);
    } catch (err) {
      logger.error({ err, portfolioPathId }, 'Failed to enqueue Portfolio generation');
      const { revertPathToUnlocked } = await import('./repository.js');
      await revertPathToUnlocked(portfolioPathId, tenantId).catch(() => {});
    }

    const strategy = await growthService.getGrowthStrategy(userId, tenantId);
    res.status(201).json({ data: strategy });
  } catch (err) {
    next(err);
  }
});

// GET /growth-strategy — get current strategy
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Clean up any paths stuck in 'generating' > 5 minutes (stale state recovery)
    await growthService.cleanupStaleGenerating(req.user!.userId, req.user!.tenantId);
    const strategy = await growthService.getGrowthStrategy(req.user!.userId, req.user!.tenantId);
    if (!strategy) {
      throw new AppError('NOT_FOUND', 'No growth strategy found. Complete your investor identity first.', 404);
    }
    res.json({ data: strategy });
  } catch (err) {
    next(err);
  }
});

// --- Growth Paths ---

// GET /growth-strategy/paths/:pathType — get path detail
router.get('/paths/:pathType', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pathType = validatePathType(String(req.params.pathType));
    const detail = await growthService.getGrowthPath(req.user!.userId, req.user!.tenantId, pathType);
    if (!detail) {
      throw new AppError('NOT_FOUND', 'Growth path not found.', 404);
    }
    res.json({ data: detail });
  } catch (err) {
    next(err);
  }
});

// POST /growth-strategy/paths/:pathType/generate — initiate path generation
router.post('/paths/:pathType/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pathType = validatePathType(String(req.params.pathType));
    const { confirm_early_unlock } = req.body ?? {};
    const { userId, tenantId } = req.user!;

    const { pathId, growthStrategyId, identityVersionId, strategyId } = await growthService.initiatePathGeneration(
      userId,
      tenantId,
      pathType,
      confirm_early_unlock === true,
    );

    // Enqueue generation job
    const { pathGenerationQueue } = await import('../../workers/growth-path-worker.js');

    try {
      await pathGenerationQueue.add({
        tenantId,
        userId,
        growthStrategyId,
        growthPathId: pathId,
        pathType,
        identityVersionId,
        strategyId,
      });
    } catch (err) {
      // Redis/Bull failure — revert and return 503
      logger.error({ err, pathId }, 'Failed to enqueue path generation');
      const { revertPathToUnlocked } = await import('./repository.js');
      await revertPathToUnlocked(pathId, tenantId).catch(() => {});
      throw new AppError('AI_SERVICE_ERROR', 'Generation service temporarily unavailable. Please try again.', 503);
    }

    const { getCurrentPath } = await import('./repository.js');
    const path = await getCurrentPath(growthStrategyId, pathType, tenantId);

    res.status(202).json({
      data: {
        id: path?.publicId ?? '',
        path_type: pathType,
        status: 'generating',
        message: `Path generation started. Check status via GET /api/v1/growth-strategy/paths/${pathType}/status`,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /growth-strategy/paths/:pathType/status — lightweight generation status polling
router.get('/paths/:pathType/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pathType = validatePathType(String(req.params.pathType));
    const detail = await growthService.getGrowthPath(req.user!.userId, req.user!.tenantId, pathType);
    if (!detail) {
      throw new AppError('NOT_FOUND', 'Growth path not found.', 404);
    }
    res.json({
      data: {
        path_type: pathType,
        status: detail.status,
        started_at: detail.status === 'generating' ? null : detail.generated_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

// --- Action Items ---

// PUT /growth-strategy/paths/:pathType/action-items/:itemId — toggle action item completion
router.put('/paths/:pathType/action-items/:itemId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pathType = validatePathType(String(req.params.pathType));
    const itemId = String(req.params.itemId);
    const { is_completed } = req.body ?? {};

    if (typeof is_completed !== 'boolean') {
      throw new AppError('VALIDATION_ERROR', 'is_completed (boolean) is required.', 400);
    }

    const result = await growthService.completeActionItem(
      req.user!.userId,
      req.user!.tenantId,
      pathType,
      itemId,
      is_completed,
    );

    res.json({
      data: {
        id: result.updatedItem.id,
        is_completed: result.updatedItem.is_completed,
        completed_at: result.updatedItem.completed_at,
        path_progress: result.pathProgress,
        overall_progress: result.overallProgress,
        unlocks_triggered: result.unlocksTriggered,
      },
    });
  } catch (err) {
    next(err);
  }
});

// --- Cross-Path Intelligence ---

// GET /growth-strategy/cross-path-insights
router.get('/cross-path-insights', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const strategy = await growthService.getGrowthStrategy(req.user!.userId, req.user!.tenantId);
    if (!strategy) {
      throw new AppError('NOT_FOUND', 'No growth strategy found.', 404);
    }

    res.json({
      data: {
        links: strategy.cross_path_insights,
        priority_actions: [], // Populated when cross-path analysis runs
        next_best_action: strategy.next_best_action,
      },
    });
  } catch (err) {
    next(err);
  }
});

// --- Admin: Migration ---

// POST /growth-strategy/admin/migrate — migrate existing V1 users to growth strategy framework
router.post('/admin/migrate', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.body ?? {};

    if (user_id) {
      // Migrate a specific user
      if (typeof user_id !== 'number' || !Number.isInteger(user_id)) {
        throw new AppError('VALIDATION_ERROR', 'user_id must be an integer.', 400);
      }

      // Verify user belongs to admin's tenant (prevent cross-tenant migration)
      const { prisma: db } = await import('../../shared/db.js');
      const targetUser = await db.user.findFirst({
        where: { id: user_id, tenantId: req.user!.tenantId, deletedAt: null },
        select: { id: true },
      });
      if (!targetUser) {
        throw new AppError('NOT_FOUND', 'User not found in your tenant.', 404);
      }

      const result = await migration.migrateUserToGrowthStrategy(user_id, req.user!.tenantId);

      // Evaluate post-migration unlocks if the user was actually migrated
      if (result.status === 'migrated') {
        const unlocked = await migration.evaluatePostMigrationUnlocks(user_id, req.user!.tenantId);
        (result as unknown as Record<string, unknown>).unlocks_triggered = unlocked;
      }

      res.json({ data: result });
    } else {
      // Migrate all users (optionally scoped to admin's tenant)
      const result = await migration.migrateAllUsers(req.user!.tenantId);

      // Evaluate post-migration unlocks for all newly migrated users
      for (const detail of result.details) {
        if (detail.status === 'migrated') {
          try {
            await migration.evaluatePostMigrationUnlocks(detail.user_id, req.user!.tenantId);
          } catch (err) {
            logger.error({ err, userId: detail.user_id }, 'Post-migration unlock evaluation failed');
          }
        }
      }

      res.json({ data: result });
    }
  } catch (err) {
    next(err);
  }
});

// --- Export ---

// POST /growth-strategy/export/markdown — generate markdown zip export
router.post('/export/markdown', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, tenantId } = req.user!;

    // Validate identity exists
    const { prisma } = await import('../../shared/db.js');
    const identity = await prisma.identityVersion.findFirst({
      where: { userId, tenantId },
      orderBy: { version: 'desc' },
    });

    if (!identity) {
      throw new AppError('VALIDATION_ERROR', 'Complete your investor identity before exporting.', 400);
    }

    // Check consent (first-time users must have given consent via the frontend)
    const hasConsent = await growthRepo.hasGivenExportConsent(userId, tenantId);
    const { consent } = req.body ?? {};
    if (!hasConsent && consent !== true) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Export consent is required. This export may include sensitive financial data.',
        400,
        [{ requires_consent: true }],
      );
    }

    // Get strategy and paths
    const strategy = await growthRepo.getActiveGrowthStrategy(userId, tenantId);
    if (!strategy) {
      throw new AppError('NOT_FOUND', 'No active growth strategy found.', 404);
    }

    const paths = await growthRepo.getAllCurrentPaths(strategy.id, tenantId);

    // Build identity data for renderers
    const identityData = {
      publicId: identity.publicId,
      version: identity.version,
      archetype: identity.archetype,
      readinessScore: identity.readinessScore,
      subScores: (identity.subScores ?? null) as Record<string, number> | null,
      headlineInsight: identity.headlineInsight ?? null,
      createdAt: identity.createdAt,
    };

    const strategyData = {
      publicId: strategy.publicId,
      status: strategy.status,
      overallProgress: strategy.overallProgress,
      growthScore: strategy.growthScore,
      createdAt: strategy.createdAt,
    };

    const pathsData = paths.map((p) => ({
      publicId: p.publicId,
      pathType: p.pathType,
      status: p.status,
      version: p.version,
      progress: p.progress,
      summary: p.summary,
      content: p.content as import('./types.js').PathContent | Record<string, never> | null,
      actionItems: (p.actionItems ?? []) as unknown as import('./types.js').ActionItem[],
      generatedAt: p.generatedAt,
    }));

    // Generate AI summary for entry point
    const narrativeSummary = await exportModule.generateExportSummary(tenantId, userId, identityData);

    // Assemble files
    const files = [
      { name: '00-entry-point.md', content: exportModule.renderEntryPoint(identityData, strategyData, narrativeSummary) },
      { name: '01-identity.md', content: exportModule.renderIdentityDetail(identityData) },
      { name: '02-strategy-overview.md', content: exportModule.renderStrategyOverview(strategyData, pathsData) },
    ];

    // Add generated path files
    const portfolioPath = pathsData.find((p) => p.pathType === 'portfolio');
    if (portfolioPath) {
      files.push({ name: '03-portfolio-growth.md', content: exportModule.renderPathFile(portfolioPath) });
    }

    const incomeCapitalPath = pathsData.find((p) => p.pathType === 'income_capital');
    if (incomeCapitalPath) {
      files.push({ name: '04-income-capital.md', content: exportModule.renderPathFile(incomeCapitalPath) });
    }

    // Action plan across all paths
    files.push({ name: '05-action-plan.md', content: exportModule.renderActionPlan(pathsData) });

    // Record export to history
    const pathVersions: Record<string, number> = {};
    const pathsIncluded: string[] = [];
    for (const p of paths) {
      pathVersions[p.pathType] = p.version;
      if (p.status === 'generated') {
        pathsIncluded.push(p.pathType);
      }
    }

    await growthRepo.createExportRecord({
      tenantId,
      userId,
      exportType: 'markdown',
      identityVersion: identity.version,
      pathVersions,
      pathsIncluded,
      consentGiven: true,
    });

    logger.info({ userId, pathsIncluded }, 'Markdown export generated');

    // Stream zip response
    await exportModule.assembleZip(files, res);
  } catch (err) {
    // If headers already sent (streaming started), log and destroy
    if (res.headersSent) {
      logger.error({ err }, 'Export error after headers sent');
      res.destroy();
      return;
    }
    next(err);
  }
});

// GET /growth-strategy/export/status — export freshness check
router.get('/export/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, tenantId } = req.user!;
    const status = await exportModule.checkExportFreshness(userId, tenantId);
    res.json({ data: status });
  } catch (err) {
    next(err);
  }
});

// --- Admin Stats (T072) ---

// GET /growth-strategy/admin/stats — growth strategy adoption metrics
router.get('/admin/stats', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prisma } = await import('../../shared/db.js');
    const tenantId = req.user!.tenantId;

    const totalStrategies = await prisma.growthStrategy.count({ where: { tenantId } });

    // Per-path unlock rates (tenant-scoped)
    const pathStats = await prisma.growthPath.groupBy({
      by: ['pathType', 'unlockType'],
      where: { isCurrent: true, tenantId },
      _count: true,
    });

    const pathUnlockRates: Record<string, { total: number; organic: number; manual: number; system: number }> = {};
    for (const stat of pathStats) {
      if (!pathUnlockRates[stat.pathType]) {
        pathUnlockRates[stat.pathType] = { total: 0, organic: 0, manual: 0, system: 0 };
      }
      const count = stat._count;
      pathUnlockRates[stat.pathType].total += count;
      if (stat.unlockType === 'organic') pathUnlockRates[stat.pathType].organic += count;
      if (stat.unlockType === 'manual') pathUnlockRates[stat.pathType].manual += count;
      if (stat.unlockType === 'system') pathUnlockRates[stat.pathType].system += count;
    }

    // Export stats (tenant-scoped)
    const markdownExports = await prisma.exportHistory.count({ where: { exportType: 'markdown', tenantId } });
    const pdfExports = await prisma.exportHistory.count({ where: { exportType: 'pdf', tenantId } });

    // Regeneration count (tenant-scoped)
    const regenerationCount = await prisma.growthPath.count({ where: { version: { gt: 1 }, tenantId } });

    res.json({
      data: {
        total_strategies_created: totalStrategies,
        path_unlock_rates: pathUnlockRates,
        export_stats: {
          markdown_exports: markdownExports,
          pdf_exports: pdfExports,
        },
        regeneration_count: regenerationCount,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
