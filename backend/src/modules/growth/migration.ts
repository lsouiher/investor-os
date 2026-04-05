import { prisma } from '../../shared/db.js';
import { AppError } from '../../shared/middleware/error-handler.js';
import { logger } from '../../shared/logger.js';
import { createGrowthStrategy, createGrowthPaths } from './repository.js';
import { evaluateUnlocks } from './service.js';
import { generatePublicId } from '../../shared/utils/id.js';
import type { PortfolioContent, ScalingPlan } from './types.js';

// --- Types ---

export interface MigrationResult {
  user_id: number;
  status: 'migrated' | 'skipped' | 'error';
  reason?: string;
  growth_strategy_id?: string;
}

export interface BulkMigrationResult {
  total: number;
  migrated: number;
  skipped: number;
  errors: number;
  details: MigrationResult[];
}

// --- Migration Functions ---

/**
 * Migrate a single existing V1 user into the Growth Strategy framework.
 *
 * Creates a growth_strategy row and 4 growth paths. Links Portfolio Growth
 * to the user's active V1 strategy. Sets Portfolio to `generated` with
 * placeholder scaling plan content. Other paths are set to `locked`.
 *
 * Idempotent: if the user already has a growth_strategy, returns skipped.
 */
export async function migrateUserToGrowthStrategy(
  userId: number,
  tenantId: number,
): Promise<MigrationResult> {
  // Idempotency: skip if growth strategy already exists
  const existing = await prisma.growthStrategy.findFirst({
    where: { userId, tenantId, status: 'active' },
  });

  if (existing) {
    return { user_id: userId, status: 'skipped', reason: 'Growth strategy already exists' };
  }

  // Get the latest identity version for this user
  const identityVersion = await prisma.identityVersion.findFirst({
    where: { userId, tenantId },
    orderBy: { version: 'desc' },
  });

  if (!identityVersion) {
    return { user_id: userId, status: 'skipped', reason: 'No identity version found' };
  }

  // Find the active V1 strategy
  const activeV1Strategy = await prisma.strategy.findFirst({
    where: { userId, tenantId, isActive: true },
    select: { id: true, name: true },
  });

  if (!activeV1Strategy) {
    return { user_id: userId, status: 'skipped', reason: 'No active V1 strategy found' };
  }

  // Create the growth strategy
  const strategy = await createGrowthStrategy({
    tenantId,
    userId,
    identityVersionId: identityVersion.id,
  });

  // Placeholder scaling plan content for the migrated Portfolio path
  const placeholderScalingPlan: ScalingPlan = {
    year_1_vision: 'Migrated from V1 strategy — generate to receive a personalized scaling plan.',
    year_3_vision: 'Migrated from V1 strategy — generate to receive a personalized scaling plan.',
    year_5_vision: 'Migrated from V1 strategy — generate to receive a personalized scaling plan.',
    year_10_vision: 'Migrated from V1 strategy — generate to receive a personalized scaling plan.',
  };

  const placeholderContent: PortfolioContent = {
    scaling_plan: placeholderScalingPlan,
    reinvestment_strategy: 'Generate to receive a personalized reinvestment strategy.',
    diversification_plan: 'Generate to receive a personalized diversification plan.',
    exit_framework: 'Generate to receive a personalized exit framework.',
    financing_evolution: 'Generate to receive a personalized financing evolution plan.',
    tool_placeholders: [],
  };

  // Create 4 path rows
  const now = new Date();
  const pathInputs = [
    {
      tenantId,
      userId,
      growthStrategyId: strategy.id,
      pathType: 'portfolio' as const,
      status: 'generated' as const,
      strategyId: activeV1Strategy.id,
      unlockType: 'system' as const,
      unlockedAt: now,
    },
    {
      tenantId,
      userId,
      growthStrategyId: strategy.id,
      pathType: 'income_capital' as const,
      status: 'locked' as const,
    },
    {
      tenantId,
      userId,
      growthStrategyId: strategy.id,
      pathType: 'skills_knowledge' as const,
      status: 'locked' as const,
    },
    {
      tenantId,
      userId,
      growthStrategyId: strategy.id,
      pathType: 'time_operations' as const,
      status: 'locked' as const,
    },
  ];

  const paths = await createGrowthPaths(pathInputs);

  // Set the Portfolio path content to the placeholder
  const portfolioPath = paths.find((p) => p.pathType === 'portfolio');
  if (portfolioPath) {
    await prisma.growthPath.update({
      where: { id: portfolioPath.id },
      data: {
        content: placeholderContent as unknown as import('@prisma/client').Prisma.InputJsonValue,
        summary: `Migrated from V1 strategy: ${activeV1Strategy.name ?? 'Active Strategy'}`,
        generatedAt: now,
      },
    });
  }

  logger.info(
    { userId, tenantId, strategyId: strategy.id },
    'User migrated to growth strategy',
  );

  return {
    user_id: userId,
    status: 'migrated',
    growth_strategy_id: strategy.publicId,
  };
}

/**
 * Run migration for all users (or a specific tenant).
 * Returns counts of migrated and skipped users.
 */
export async function migrateAllUsers(
  tenantId?: number,
): Promise<BulkMigrationResult> {
  // Find all users who have at least one identity version (i.e. completed identity synthesis)
  const whereClause = tenantId ? { tenantId } : {};
  const users = await prisma.user.findMany({
    where: {
      ...whereClause,
      identityVersions: { some: {} },
    },
    select: { id: true, tenantId: true },
  });

  const result: BulkMigrationResult = {
    total: users.length,
    migrated: 0,
    skipped: 0,
    errors: 0,
    details: [],
  };

  for (const user of users) {
    try {
      const migrationResult = await migrateUserToGrowthStrategy(user.id, user.tenantId);
      result.details.push(migrationResult);

      if (migrationResult.status === 'migrated') {
        result.migrated++;
      } else if (migrationResult.status === 'skipped') {
        result.skipped++;
      }
    } catch (err) {
      result.errors++;
      result.details.push({
        user_id: user.id,
        status: 'error',
        reason: err instanceof Error ? err.message : 'Unknown error',
      });
      logger.error({ err, userId: user.id }, 'Migration failed for user');
    }
  }

  logger.info(
    { total: result.total, migrated: result.migrated, skipped: result.skipped, errors: result.errors },
    'Bulk migration completed',
  );

  return result;
}

/**
 * After creating a growth strategy via migration, evaluate unlock conditions
 * based on existing completed micro-tasks and activity history.
 *
 * This uses the existing evaluateUnlocks from service.ts which checks
 * micro-plan task completions and other activity triggers.
 */
export async function evaluatePostMigrationUnlocks(
  userId: number,
  tenantId: number,
): Promise<string[]> {
  // Verify growth strategy exists
  const strategy = await prisma.growthStrategy.findFirst({
    where: { userId, tenantId, status: 'active' },
  });

  if (!strategy) {
    logger.warn({ userId, tenantId }, 'No growth strategy found for post-migration unlock evaluation');
    return [];
  }

  // Delegate to the existing unlock evaluation logic
  const unlockedPaths = await evaluateUnlocks(userId, tenantId);

  if (unlockedPaths.length > 0) {
    logger.info(
      { userId, tenantId, unlockedPaths },
      'Post-migration unlock evaluation triggered unlocks',
    );
  }

  return unlockedPaths;
}
