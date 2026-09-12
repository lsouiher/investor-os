import { Prisma, GrowthPathType, GrowthPathStatus } from '@prisma/client';
import { prisma } from '../../shared/db.js';
import { generatePublicId } from '../../shared/utils/id.js';
import type { ActionItem, CrossPathLink, NextBestAction } from './types.js';

// --- Growth Strategy ---

export interface CreateGrowthStrategyInput {
  tenantId: number;
  userId: number;
  identityVersionId: number;
}

export async function createGrowthStrategy(input: CreateGrowthStrategyInput) {
  return prisma.growthStrategy.create({
    data: {
      publicId: generatePublicId(),
      tenantId: input.tenantId,
      userId: input.userId,
      identityVersionId: input.identityVersionId,
      status: 'active',
    },
  });
}

export async function getActiveGrowthStrategy(userId: number, tenantId: number) {
  return prisma.growthStrategy.findFirst({
    where: { userId, tenantId, status: 'active' },
    include: {
      paths: {
        where: { isCurrent: true },
        orderBy: { pathType: 'asc' },
      },
      identityVersion: {
        select: {
          publicId: true,
          version: true,
          archetype: true,
          readinessScore: true,
        },
      },
    },
  });
}

export async function getGrowthStrategyById(id: number, tenantId: number) {
  return prisma.growthStrategy.findFirst({
    where: { id, tenantId },
  });
}

export async function updateGrowthStrategyProgress(
  id: number,
  tenantId: number,
  overallProgress: number,
  growthScore: number,
) {
  return prisma.growthStrategy.updateMany({
    where: { id, tenantId },
    data: { overallProgress, growthScore },
  });
}

export async function updateCrossPathLinks(
  id: number,
  crossPathLinks: CrossPathLink[],
  nextBestAction: NextBestAction | null,
) {
  return prisma.growthStrategy.update({
    where: { id },
    data: {
      crossPathLinks: crossPathLinks as unknown as Prisma.InputJsonValue,
      nextBestAction: nextBestAction as unknown as Prisma.InputJsonValue ?? Prisma.JsonNull,
    },
  });
}

// --- Growth Paths ---

export interface CreateGrowthPathInput {
  tenantId: number;
  userId: number;
  growthStrategyId: number;
  pathType: GrowthPathType;
  status: GrowthPathStatus;
  strategyId?: number | null;
  unlockType?: 'organic' | 'manual' | 'system' | null;
  unlockedAt?: Date | null;
}

export async function createGrowthPath(input: CreateGrowthPathInput) {
  return prisma.growthPath.create({
    data: {
      publicId: generatePublicId(),
      tenantId: input.tenantId,
      userId: input.userId,
      growthStrategyId: input.growthStrategyId,
      pathType: input.pathType,
      status: input.status,
      strategyId: input.strategyId ?? null,
      unlockType: input.unlockType ?? null,
      unlockedAt: input.unlockedAt ?? null,
    },
  });
}

export async function createGrowthPaths(paths: CreateGrowthPathInput[]) {
  const results = [];
  for (const p of paths) {
    results.push(await createGrowthPath(p));
  }
  return results;
}

export async function getCurrentPath(
  growthStrategyId: number,
  pathType: GrowthPathType,
  tenantId: number,
) {
  return prisma.growthPath.findFirst({
    where: { growthStrategyId, pathType, tenantId, isCurrent: true },
  });
}

export async function getCurrentPathWithStrategy(
  growthStrategyId: number,
  pathType: GrowthPathType,
  tenantId: number,
) {
  return prisma.growthPath.findFirst({
    where: { growthStrategyId, pathType, tenantId, isCurrent: true },
    include: {
      strategy: {
        select: {
          publicId: true,
          name: true,
          fitScore: true,
          actionPlan: true,
          roadmap: true,
          microPlan: true,
        },
      },
    },
  });
}

export async function getAllCurrentPaths(growthStrategyId: number, tenantId: number) {
  return prisma.growthPath.findMany({
    where: { growthStrategyId, tenantId, isCurrent: true },
    orderBy: { pathType: 'asc' },
  });
}

export async function updatePathStatus(id: number, tenantId: number, status: GrowthPathStatus) {
  return prisma.growthPath.updateMany({
    where: { id, tenantId },
    data: { status },
  });
}

export async function updatePathGenerated(
  id: number,
  tenantId: number,
  content: Prisma.InputJsonValue,
  actionItems: Prisma.InputJsonValue,
  summary: string,
) {
  return prisma.growthPath.updateMany({
    where: { id, tenantId },
    data: {
      status: 'generated',
      content,
      actionItems,
      summary,
      generatedAt: new Date(),
      generationCooldownUntil: new Date(Date.now() + 60 * 60 * 1000), // 1 hour cooldown
    },
  });
}

export async function revertPathToUnlocked(id: number, tenantId: number) {
  return prisma.growthPath.updateMany({
    where: { id, tenantId },
    data: { status: 'unlocked' },
  });
}

/**
 * Atomically set path to 'generating' only if it's currently in an allowed state.
 * Returns the count of updated rows (0 = already generating or locked).
 */
export async function setPathGenerating(id: number, tenantId: number) {
  return prisma.growthPath.updateMany({
    where: { id, tenantId, status: { in: ['unlocked', 'generated'] } },
    data: { status: 'generating' },
  });
}

export async function unlockPath(
  id: number,
  tenantId: number,
  unlockType: 'organic' | 'manual' | 'system',
  unlockTrigger: Prisma.InputJsonValue,
) {
  return prisma.growthPath.updateMany({
    where: { id, tenantId, status: 'locked' },
    data: {
      status: 'unlocked',
      unlockType,
      unlockedAt: new Date(),
      unlockTrigger,
    },
  });
}

/**
 * Atomically update an action item in the JSONB array using SELECT FOR UPDATE.
 * Prevents race conditions on concurrent action item completions.
 */
export async function updateActionItemCompletion(
  pathId: number,
  tenantId: number,
  actionItemId: string,
  isCompleted: boolean,
) {
  return prisma.$transaction(async (tx) => {
    // Set tenant context for RLS
    await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${String(tenantId)}, true)`;

    // Lock the row
    const rows = await tx.$queryRaw<Array<{ id: number; action_items: Prisma.JsonValue }>>`
      SELECT id, action_items FROM growth_paths
      WHERE id = ${pathId} AND tenant_id = ${tenantId} AND is_current = true
      FOR UPDATE
    `;

    if (rows.length === 0) {
      throw new Error('Growth path not found');
    }

    const actionItems = rows[0].action_items as unknown as ActionItem[];
    const itemIndex = actionItems.findIndex((item) => item.id === actionItemId);
    if (itemIndex === -1) {
      throw new Error('Action item not found');
    }

    actionItems[itemIndex].is_completed = isCompleted;
    actionItems[itemIndex].completed_at = isCompleted ? new Date().toISOString() : null;

    // Calculate new progress
    const total = actionItems.length;
    const completed = actionItems.filter((item) => item.is_completed).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Update the row
    await tx.growthPath.update({
      where: { id: pathId },
      data: {
        actionItems: actionItems as unknown as Prisma.InputJsonValue,
        progress,
      },
    });

    return { actionItems, progress, updatedItem: actionItems[itemIndex] };
  });
}

// --- Export History ---

export interface CreateExportInput {
  tenantId: number;
  userId: number;
  exportType: 'markdown' | 'pdf';
  identityVersion: number;
  pathVersions: Record<string, number>;
  pathsIncluded: string[];
  consentGiven: boolean;
}

export async function createExportRecord(input: CreateExportInput) {
  return prisma.exportHistory.create({
    data: {
      publicId: generatePublicId(),
      tenantId: input.tenantId,
      userId: input.userId,
      exportType: input.exportType,
      identityVersion: input.identityVersion,
      pathVersions: input.pathVersions as unknown as Prisma.InputJsonValue,
      pathsIncluded: input.pathsIncluded as unknown as Prisma.InputJsonValue,
      consentGiven: input.consentGiven,
    },
  });
}

export async function getLatestExport(userId: number, tenantId: number) {
  return prisma.exportHistory.findFirst({
    where: { userId, tenantId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function hasGivenExportConsent(userId: number, tenantId: number) {
  const record = await prisma.exportHistory.findFirst({
    where: { userId, tenantId, consentGiven: true },
    select: { id: true },
  });
  return !!record;
}

/**
 * Create a new path version for regeneration (append-only per constitution IV).
 * Sets previous version's is_current to false and creates new row with version+1.
 */
export async function createPathVersion(
  currentPathId: number,
  tenantId: number,
) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.growthPath.findFirst({
      where: { id: currentPathId, tenantId, isCurrent: true },
    });
    if (!current) {
      throw new Error('Current path not found');
    }

    // Mark current as not current
    await tx.growthPath.update({
      where: { id: currentPathId },
      data: { isCurrent: false },
    });

    // Create new version, preserving unlock metadata
    return tx.growthPath.create({
      data: {
        publicId: generatePublicId(),
        tenantId: current.tenantId,
        userId: current.userId,
        growthStrategyId: current.growthStrategyId,
        pathType: current.pathType,
        status: 'unlocked',
        version: current.version + 1,
        isCurrent: true,
        strategyId: current.strategyId,
        unlockType: current.unlockType,
        unlockedAt: current.unlockedAt,
        unlockTrigger: current.unlockTrigger ?? Prisma.JsonNull,
      },
    });
  });
}
