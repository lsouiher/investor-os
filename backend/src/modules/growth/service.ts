import { GrowthPathType } from '@prisma/client';
import { AppError } from '../../shared/middleware/error-handler.js';
import { logger } from '../../shared/logger.js';
import { prisma } from '../../shared/db.js';
import { render, t, type Locale, type LocalizedText, type MessageKey } from '../../shared/i18n.js';
import * as growthRepo from './repository.js';
import { recalculateStrategyProgress } from './generation.js';
import type {
  ActionItem,
  GrowthStrategyResponse,
  GrowthPathDetail,
  GrowthPathSummary,
  CrossPathLink,
  NextBestAction,
  UnlockTriggerDetails,
} from './types.js';

// Path type ordering for consistent display
const PATH_ORDER: GrowthPathType[] = ['portfolio', 'income_capital', 'skills_knowledge', 'time_operations'];

// Stub paths (Approach C: only Portfolio + Income & Capital get AI content)
const STUB_PATHS: Set<string> = new Set(['skills_knowledge', 'time_operations']);

// Unlock criteria descriptions, as dictionary keys: they are written in the language of the
// request that displays them
const UNLOCK_CRITERIA: Record<string, MessageKey> = {
  income_capital: 'growth.unlock_criteria.income_capital',
  skills_knowledge: 'growth.unlock_criteria.coming_soon',
  time_operations: 'growth.unlock_criteria.coming_soon',
};

function unlockCriteria(pathType: string, locale: Locale): string {
  const key = UNLOCK_CRITERIA[pathType];
  return key ? t(locale, key) : '';
}

/**
 * Create a growth strategy with 4 path rows.
 * Portfolio is auto-unlocked (system), others are locked.
 */
export async function createGrowthStrategy(
  userId: number,
  tenantId: number,
  identityVersionId: number,
): Promise<{ strategyId: number; portfolioPathId: number }> {
  // Check for existing active strategy (idempotency)
  const existing = await growthRepo.getActiveGrowthStrategy(userId, tenantId);
  if (existing) {
    throw AppError.localized('VALIDATION_ERROR', 'growth.already_exists', {}, 409);
  }

  // Find active V1 strategy for Portfolio Growth reference
  const activeV1Strategy = await prisma.strategy.findFirst({
    where: { userId, tenantId, isActive: true },
    select: { id: true },
  });

  // Create the growth strategy
  const strategy = await growthRepo.createGrowthStrategy({
    tenantId,
    userId,
    identityVersionId,
  });

  // Create 4 path rows
  const pathInputs = PATH_ORDER.map((pathType) => ({
    tenantId,
    userId,
    growthStrategyId: strategy.id,
    pathType,
    status: pathType === 'portfolio' ? 'unlocked' as const : 'locked' as const,
    strategyId: pathType === 'portfolio' ? (activeV1Strategy?.id ?? null) : null,
    unlockType: pathType === 'portfolio' ? 'system' as const : null,
    unlockedAt: pathType === 'portfolio' ? new Date() : null,
  }));

  const paths = await growthRepo.createGrowthPaths(pathInputs);
  const portfolioPath = paths.find((p) => p.pathType === 'portfolio')!;

  logger.info({ userId, strategyId: strategy.id }, 'Growth strategy created');

  return { strategyId: strategy.id, portfolioPathId: portfolioPath.id };
}

/**
 * Auto-create growth strategy after identity synthesis if feature flag is on.
 * Fire-and-forget — must not fail the caller.
 */
export async function maybeCreateGrowthStrategy(
  userId: number,
  tenantId: number,
  identityVersionId: number,
): Promise<void> {
  // Check feature flag
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { featureFlags: true },
  });
  const flags = (tenant?.featureFlags ?? {}) as Record<string, unknown>;
  if (!flags.growth_strategy_enabled) return;

  // Check if strategy already exists
  const existing = await growthRepo.getActiveGrowthStrategy(userId, tenantId);
  if (existing) return;

  const { strategyId, portfolioPathId } = await createGrowthStrategy(userId, tenantId, identityVersionId);

  // Enqueue Portfolio generation
  const { pathGenerationQueue } = await import('../../workers/growth-path-worker.js');

  // Find the active V1 strategy for Portfolio reference
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
      identityVersionId,
      strategyId: activeV1Strategy?.id ?? null,
    });

    // Set path to generating
    await growthRepo.setPathGenerating(portfolioPathId, tenantId);
  } catch (err) {
    // Enqueue failed — revert path to unlocked
    logger.error({ err, portfolioPathId }, 'Failed to enqueue Portfolio generation');
    await growthRepo.revertPathToUnlocked(portfolioPathId, tenantId).catch(() => {});
  }
}

/**
 * Get the current growth strategy formatted for API response.
 */
export async function getGrowthStrategy(
  userId: number,
  tenantId: number,
  locale: Locale,
): Promise<GrowthStrategyResponse | null> {
  const strategy = await growthRepo.getActiveGrowthStrategy(userId, tenantId);
  if (!strategy) return null;

  // Get export staleness
  const latestExport = await growthRepo.getLatestExport(userId, tenantId);
  const exportStaleness = {
    is_stale: false,
    last_export_at: latestExport?.createdAt.toISOString() ?? null,
    changed_since_export: [] as string[],
  };

  if (latestExport) {
    const exportPathVersions = latestExport.pathVersions as Record<string, number>;
    const exportIdentityVersion = latestExport.identityVersion;

    if (strategy.identityVersion.version > exportIdentityVersion) {
      exportStaleness.is_stale = true;
      exportStaleness.changed_since_export.push(
        t(locale, 'growth.staleness.identity_updated', { from: exportIdentityVersion, to: strategy.identityVersion.version }),
      );
    }

    for (const path of strategy.paths) {
      const exportVersion = exportPathVersions[path.pathType] ?? 0;
      if (path.version > exportVersion && path.status === 'generated') {
        exportStaleness.is_stale = true;
        exportStaleness.changed_since_export.push(
          t(locale, 'growth.staleness.path_regenerated', { path: pathName(path.pathType), from: exportVersion, to: path.version }),
        );
      }
    }
  }

  const paths: GrowthPathSummary[] = strategy.paths.map((p) => {
    const actionItems = (p.actionItems ?? []) as unknown as ActionItem[];
    const summary: GrowthPathSummary = {
      id: p.publicId,
      path_type: p.pathType,
      status: p.status,
      version: p.version,
      progress: p.progress,
      summary: p.summary,
      unlocked_at: p.unlockedAt?.toISOString() ?? null,
      unlock_type: p.unlockType,
      generated_at: p.generatedAt?.toISOString() ?? null,
      action_item_count: actionItems.length,
      completed_action_items: actionItems.filter((a) => a.is_completed).length,
    };

    if (p.status === 'locked') {
      summary.unlock_criteria = unlockCriteria(p.pathType, locale);
      summary.unlock_progress = getUnlockProgress(p.pathType, userId, tenantId);
    }

    return summary;
  });

  return {
    id: strategy.publicId,
    status: strategy.status,
    overall_progress: strategy.overallProgress,
    growth_score: strategy.growthScore,
    identity_version: {
      id: strategy.identityVersion.publicId,
      version: strategy.identityVersion.version,
      archetype: strategy.identityVersion.archetype,
      readiness_score: strategy.identityVersion.readinessScore,
    },
    paths,
    cross_path_insights: (strategy.crossPathLinks ?? []) as unknown as CrossPathLink[],
    next_best_action: (strategy.nextBestAction ?? null) as unknown as NextBestAction | null,
    export_staleness: exportStaleness,
    created_at: strategy.createdAt.toISOString(),
  };
}

/**
 * Get full detail for a specific growth path.
 */
export async function getGrowthPath(
  userId: number,
  tenantId: number,
  pathType: GrowthPathType,
  locale: Locale,
): Promise<GrowthPathDetail | null> {
  const strategy = await growthRepo.getActiveGrowthStrategy(userId, tenantId);
  if (!strategy) return null;

  const path = await growthRepo.getCurrentPathWithStrategy(strategy.id, pathType, tenantId);
  if (!path) return null;

  const actionItems = (path.actionItems ?? []) as unknown as ActionItem[];

  const detail: GrowthPathDetail = {
    id: path.publicId,
    path_type: path.pathType,
    status: path.status,
    version: path.version,
    progress: path.progress,
    summary: path.summary,
    content: path.content as GrowthPathDetail['content'],
    action_items: actionItems,
    unlock_type: path.unlockType,
    unlocked_at: path.unlockedAt?.toISOString() ?? null,
    generated_at: path.generatedAt?.toISOString() ?? null,
    generation_cooldown_until: path.generationCooldownUntil?.toISOString() ?? null,
  };

  // Add V1 strategy data for Portfolio path
  if (path.pathType === 'portfolio' && path.strategy) {
    const s = path.strategy;
    const actionPlan = (s.actionPlan as { items?: Array<{ is_completed?: boolean }> }) ?? { items: [] };
    const roadmap = (s.roadmap as { milestones?: Array<{ is_completed?: boolean }> }) ?? { milestones: [] };
    const microPlan = (s.microPlan as { tasks?: Array<{ is_completed?: boolean }>; expires_at?: string } | null) ?? { tasks: [], expires_at: null };

    detail.strategy = {
      id: s.publicId,
      name: s.name,
      fit_score: s.fitScore,
      action_plan: {
        item_count: actionPlan.items?.length ?? 0,
        completed_count: actionPlan.items?.filter((i) => i.is_completed).length ?? 0,
      },
      roadmap: {
        milestone_count: roadmap.milestones?.length ?? 0,
        completed_count: roadmap.milestones?.filter((m) => m.is_completed).length ?? 0,
      },
      micro_plan: {
        task_count: microPlan.tasks?.length ?? 0,
        completed_count: microPlan.tasks?.filter((t) => t.is_completed).length ?? 0,
        expires_at: microPlan.expires_at ?? null,
      },
    };
  }

  if (path.status === 'locked') {
    detail.unlock_criteria = unlockCriteria(path.pathType, locale);
    detail.unlock_progress = getUnlockProgress(path.pathType, userId, tenantId);
  }

  return detail;
}

/**
 * Start generation for a path. Validates status, rate limit, and feature availability.
 * Returns the path ID for job enqueuing.
 */
export async function initiatePathGeneration(
  userId: number,
  tenantId: number,
  pathType: GrowthPathType,
  confirmEarlyUnlock?: boolean,
): Promise<{ pathId: number; growthStrategyId: number; identityVersionId: number; strategyId: number | null }> {
  // Check for stub paths
  if (STUB_PATHS.has(pathType)) {
    throw AppError.localized('VALIDATION_ERROR', 'growth.coming_soon_generate', { path: pathName(pathType) }, 400);
  }

  const strategy = await growthRepo.getActiveGrowthStrategy(userId, tenantId);
  if (!strategy) {
    throw AppError.localized('NOT_FOUND', 'growth.no_active_strategy', {}, 404);
  }

  const path = await growthRepo.getCurrentPath(strategy.id, pathType, tenantId);
  if (!path) {
    throw AppError.localized('NOT_FOUND', 'growth.path_not_found', {}, 404);
  }

  // Check if already generating (idempotency guard — 409)
  if (path.status === 'generating') {
    throw AppError.localized('VALIDATION_ERROR', 'growth.path_already_generating', {}, 409);
  }

  // Handle locked paths (manual early unlock)
  if (path.status === 'locked') {
    if (!confirmEarlyUnlock) {
      const criteria = UNLOCK_CRITERIA[pathType];
      throw AppError.localized(
        'VALIDATION_ERROR',
        'growth.early_unlock',
        { criteria: { key: criteria ?? 'growth.unlock_criteria.default' } },
        400,
        [{ unlock_criteria: criteria ? { key: criteria } : '' }],
      );
    }

    // Manual early unlock
    await growthRepo.unlockPath(path.id, tenantId, 'manual', {
      reason: 'Manual early unlock by user',
    } as unknown as import('@prisma/client').Prisma.InputJsonValue);

    logger.info({ userId, pathType }, 'Manual early unlock');
  }

  // Rate limit check
  if (path.generationCooldownUntil && new Date() < path.generationCooldownUntil) {
    throw AppError.localized(
      'RATE_LIMITED',
      'growth.cooldown_generate',
      { minutes: minutesUntil(path.generationCooldownUntil) },
      429,
      [{ cooldown_until: path.generationCooldownUntil.toISOString() }],
    );
  }

  // Set to generating
  await growthRepo.setPathGenerating(path.id, tenantId);

  return {
    pathId: path.id,
    growthStrategyId: strategy.id,
    identityVersionId: strategy.identityVersionId,
    strategyId: path.strategyId,
  };
}

/**
 * Evaluate unlock conditions for all locked paths.
 * Called after task completions, action item completions, and logins.
 */
export async function evaluateUnlocks(userId: number, tenantId: number): Promise<string[]> {
  const strategy = await growthRepo.getActiveGrowthStrategy(userId, tenantId);
  if (!strategy) return [];

  const paths = strategy.paths;
  const unlockedPaths: string[] = [];

  for (const path of paths) {
    if (path.status !== 'locked') continue;

    let shouldUnlock = false;
    let trigger: UnlockTriggerDetails | null = null;

    switch (path.pathType) {
      case 'income_capital': {
        // Path 2: 2+ completed micro-plan tasks from V1 strategy
        const activeStrategy = await prisma.strategy.findFirst({
          where: { userId, tenantId, isActive: true },
          select: { microPlan: true },
        });
        const microPlan = (activeStrategy?.microPlan as { tasks?: Array<{ is_completed?: boolean }> } | null) ?? null;
        const completedTasks = microPlan?.tasks?.filter((t) => t.is_completed).length ?? 0;
        if (completedTasks >= 2) {
          shouldUnlock = true;
          trigger = {
            reason: 'Completed 2+ micro-plan tasks',
            completed_count: completedTasks,
            required_count: 2,
          };
        }
        break;
      }

      case 'skills_knowledge': {
        // Path 3: Paths 1+2 generated AND 1+ action item completed from either
        // Stubs don't unlock organically — skip
        break;
      }

      case 'time_operations': {
        // Path 4: 3 paths generated AND 14+ days since creation with activity
        // Stubs don't unlock organically — skip
        break;
      }
    }

    if (shouldUnlock && trigger) {
      await growthRepo.unlockPath(
        path.id,
        tenantId,
        'organic',
        trigger as unknown as import('@prisma/client').Prisma.InputJsonValue,
      );
      unlockedPaths.push(path.pathType);

      // Log to activity logs
      await prisma.activityLog.create({
        data: {
          tenantId,
          userId,
          eventType: 'growth_path.unlocked',
          payload: JSON.parse(JSON.stringify({ path_type: path.pathType, unlock_type: 'organic', trigger_reason: trigger.reason })),
        },
      }).catch((err) => logger.error({ err }, 'Failed to log unlock event'));

      logger.info({ userId, pathType: path.pathType }, 'Path unlocked organically');
    }
  }

  return unlockedPaths;
}

/**
 * Mark an action item as completed/uncompleted and evaluate unlocks.
 */
export async function completeActionItem(
  userId: number,
  tenantId: number,
  pathType: GrowthPathType,
  actionItemId: string,
  isCompleted: boolean,
  locale: Locale,
): Promise<{
  updatedItem: ActionItem;
  pathProgress: number;
  overallProgress: number;
  unlocksTriggered: Array<{ path_type: string; unlock_type: string; message: string }>;
}> {
  const strategy = await growthRepo.getActiveGrowthStrategy(userId, tenantId);
  if (!strategy) {
    throw AppError.localized('NOT_FOUND', 'growth.no_active_strategy', {}, 404);
  }

  const path = await growthRepo.getCurrentPath(strategy.id, pathType, tenantId);
  if (!path || path.status !== 'generated') {
    throw AppError.localized('NOT_FOUND', 'growth.path_not_generated', {}, 404);
  }

  // Atomically update action item with row-level locking
  const { updatedItem, progress } = await growthRepo.updateActionItemCompletion(
    path.id,
    tenantId,
    actionItemId,
    isCompleted,
  );

  // Recalculate strategy progress
  await recalculateStrategyProgress(strategy.id, tenantId);
  const updatedStrategy = await growthRepo.getGrowthStrategyById(strategy.id, tenantId);
  const overallProgress = updatedStrategy?.overallProgress ?? 0;

  // Evaluate unlocks
  const unlockedPathTypes = await evaluateUnlocks(userId, tenantId);
  const unlocksTriggered = unlockedPathTypes.map((pt) => ({
    path_type: pt,
    unlock_type: 'organic',
    message: t(locale, 'growth.unlocked', { path: pathName(pt) }),
  }));

  // Log action item completion
  await prisma.activityLog.create({
    data: {
      tenantId,
      userId,
      eventType: isCompleted ? 'growth_action_item.completed' : 'growth_action_item.uncompleted',
      payload: { path_type: pathType, action_item_id: actionItemId },
    },
  }).catch((err) => logger.error({ err }, 'Failed to log action item event'));

  return { updatedItem, pathProgress: progress, overallProgress, unlocksTriggered };
}

// --- Regeneration (T066-T071) ---

/**
 * Regenerate an individual path. Creates new version row (append-only per constitution IV).
 */
export async function regeneratePath(
  userId: number,
  tenantId: number,
  pathType: GrowthPathType,
): Promise<{ newPathId: number; growthStrategyId: number; identityVersionId: number; strategyId: number | null }> {
  if (STUB_PATHS.has(pathType)) {
    throw AppError.localized('VALIDATION_ERROR', 'growth.coming_soon_regenerate', { path: pathName(pathType) }, 400);
  }

  const strategy = await growthRepo.getActiveGrowthStrategy(userId, tenantId);
  if (!strategy) throw AppError.localized('NOT_FOUND', 'growth.no_active_strategy', {}, 404);

  const currentPath = await growthRepo.getCurrentPath(strategy.id, pathType, tenantId);
  if (!currentPath || currentPath.status !== 'generated') {
    throw AppError.localized('VALIDATION_ERROR', 'growth.path_must_be_generated', {}, 400);
  }

  // Rate limit check
  if (currentPath.generationCooldownUntil && new Date() < currentPath.generationCooldownUntil) {
    throw AppError.localized(
      'RATE_LIMITED',
      'growth.cooldown_regenerate',
      { minutes: minutesUntil(currentPath.generationCooldownUntil) },
      429,
    );
  }

  // Create new version (append-only: old version preserved with is_current=false)
  const newPath = await growthRepo.createPathVersion(currentPath.id, tenantId);
  await growthRepo.setPathGenerating(newPath.id, tenantId);

  return {
    newPathId: newPath.id,
    growthStrategyId: strategy.id,
    identityVersionId: strategy.identityVersionId,
    strategyId: newPath.strategyId,
  };
}

/**
 * Regenerate all generated paths in the strategy sequentially.
 */
export async function regenerateFullStrategy(
  userId: number,
  tenantId: number,
): Promise<Array<{ pathType: GrowthPathType; newPathId: number }>> {
  const strategy = await growthRepo.getActiveGrowthStrategy(userId, tenantId);
  if (!strategy) throw AppError.localized('NOT_FOUND', 'growth.no_active_strategy', {}, 404);

  const generatedPaths = strategy.paths.filter(
    (p) => p.status === 'generated' && !STUB_PATHS.has(p.pathType),
  );

  const results: Array<{ pathType: GrowthPathType; newPathId: number }> = [];
  for (const path of generatedPaths) {
    const result = await regeneratePath(userId, tenantId, path.pathType);
    results.push({ pathType: path.pathType, newPathId: result.newPathId });
  }

  return results;
}

/**
 * Check if identity score delta warrants a regeneration suggestion.
 * Called after new identity synthesis.
 */
export async function checkRegenerationSuggestion(
  userId: number,
  tenantId: number,
  newReadinessScore: number,
): Promise<boolean> {
  const strategy = await growthRepo.getActiveGrowthStrategy(userId, tenantId);
  if (!strategy) return false;

  const oldScore = strategy.identityVersion.readinessScore;
  const delta = Math.abs(newReadinessScore - oldScore);

  if (delta > 10) {
    // Create insight notification
    await prisma.activityLog.create({
      data: {
        tenantId,
        userId,
        eventType: 'growth_strategy.refresh_suggested',
        payload: JSON.parse(JSON.stringify({
          old_score: oldScore,
          new_score: newReadinessScore,
          delta,
          message: 'Your Growth Strategy may benefit from a refresh based on your updated identity.',
        })),
      },
    }).catch((err) => logger.error({ err }, 'Failed to log regeneration suggestion'));

    logger.info({ userId, delta }, 'Growth strategy refresh suggested');
    return true;
  }

  return false;
}

/**
 * Check if any path needs a 90-day refresh.
 */
export async function getRefreshSuggestions(
  userId: number,
  tenantId: number,
  locale: Locale,
): Promise<string[]> {
  const strategy = await growthRepo.getActiveGrowthStrategy(userId, tenantId);
  if (!strategy) return [];

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  return strategy.paths
    .filter((p) => p.status === 'generated' && p.generatedAt && p.generatedAt < ninetyDaysAgo)
    .map((p) => render(locale, pathName(p.pathType)));
}

/**
 * Clean up paths stuck in 'generating' for more than 5 minutes.
 * Called on dashboard load to prevent permanent stuck states.
 */
export async function cleanupStaleGenerating(userId: number, tenantId: number): Promise<number> {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const result = await prisma.growthPath.updateMany({
    where: {
      userId,
      tenantId,
      status: 'generating',
      updatedAt: { lt: fiveMinutesAgo },
      isCurrent: true,
    },
    data: { status: 'unlocked' },
  });

  if (result.count > 0) {
    logger.warn({ userId, count: result.count }, 'Reverted stale generating paths to unlocked');
  }
  return result.count;
}

// --- Helpers ---

const PATH_NAMES: Record<string, MessageKey> = {
  portfolio: 'path.portfolio',
  income_capital: 'path.income_capital',
  skills_knowledge: 'path.skills_knowledge',
  time_operations: 'path.time_operations',
};

// The path's display name as a message parameter: a dictionary key, rendered with the sentence
// around it; an unknown type passes through as written
export function pathName(pathType: string): LocalizedText | string {
  const key = PATH_NAMES[pathType];
  return key ? { key } : pathType;
}

// Cooldowns are told as a duration, not a clock time: the server does not know the reader's time zone
function minutesUntil(date: Date): number {
  return Math.max(1, Math.ceil((date.getTime() - Date.now()) / 60_000));
}

function getUnlockProgress(_pathType: string, _userId: number, _tenantId: number): string {
  // This would do real queries in production — placeholder for now
  // Will be populated when unlock evaluation is fully wired
  return '';
}
