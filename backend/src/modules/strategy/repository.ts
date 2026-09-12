import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/db.js';
import { generatePublicId } from '../../shared/utils/id.js';
import type { ActionPlanJson, RoadmapJson, MicroPlanJson } from './types.js';

export interface CreateStrategyInput {
  tenantId: number;
  userId: number;
  identityVersionId: number;
  name: string;
  description: string;
  fitScore: number;
  pros: string[];
  cons: string[];
  rank: number;
}

/**
 * Bulk create strategies (typically 3 per synthesis).
 */
export async function createStrategies(strategies: CreateStrategyInput[]) {
  const results = [];
  for (const s of strategies) {
    const created = await prisma.strategy.create({
      data: {
        publicId: generatePublicId(),
        tenantId: s.tenantId,
        userId: s.userId,
        identityVersionId: s.identityVersionId,
        name: s.name,
        description: s.description,
        fitScore: s.fitScore,
        pros: s.pros as unknown as Prisma.InputJsonValue,
        cons: s.cons as unknown as Prisma.InputJsonValue,
        rank: s.rank,
        isActive: false,
        needsRefresh: false,
      },
    });
    results.push(created);
  }
  return results;
}

/**
 * Get all strategies for a user (latest identity version).
 */
export async function getStrategiesByUser(userId: number, tenantId: number, identityVersionId?: number) {
  return prisma.strategy.findMany({
    where: { userId, tenantId, ...(identityVersionId !== undefined ? { identityVersionId } : {}) },
    orderBy: [{ createdAt: 'desc' }, { rank: 'asc' }],
  });
}

/**
 * Get a single strategy by its public ID.
 */
export async function getStrategyByPublicId(publicId: string, tenantId: number) {
  return prisma.strategy.findFirst({
    where: { publicId, tenantId },
  });
}

/**
 * Get the active strategy for a user.
 */
export async function getActiveStrategy(userId: number, tenantId: number) {
  return prisma.strategy.findFirst({
    where: { userId, tenantId, isActive: true },
  });
}

/**
 * Activate a strategy: set isActive=true, deactivate all others for the user.
 */
export async function activateStrategy(strategyId: number, userId: number, tenantId: number) {
  return prisma.$transaction(async (tx) => {
    // Deactivate all strategies for this user
    await tx.strategy.updateMany({
      where: { userId, tenantId },
      data: { isActive: false },
    });

    // Activate the selected one
    return tx.strategy.update({
      where: { id: strategyId },
      data: { isActive: true },
    });
  });
}

/**
 * Update strategy JSONB details (action plan, roadmap, micro-plan).
 */
export async function updateStrategyDetails(
  strategyId: number,
  data: {
    actionPlan?: ActionPlanJson;
    roadmap?: RoadmapJson;
    microPlan?: MicroPlanJson;
  },
) {
  const updateData: Prisma.StrategyUpdateInput = {};

  if (data.actionPlan !== undefined) {
    updateData.actionPlan = data.actionPlan as unknown as Prisma.InputJsonValue;
  }
  if (data.roadmap !== undefined) {
    updateData.roadmap = data.roadmap as unknown as Prisma.InputJsonValue;
  }
  if (data.microPlan !== undefined) {
    updateData.microPlan = data.microPlan as unknown as Prisma.InputJsonValue;
  }

  return prisma.strategy.update({
    where: { id: strategyId },
    data: updateData,
  });
}

/**
 * Update a specific action item within the actionPlan JSONB.
 */
export async function updateActionItem(
  strategyId: number,
  itemId: string,
  updates: { is_completed?: boolean },
) {
  return prisma.$transaction(async (tx) => {
    const strategy = await tx.strategy.findUnique({ where: { id: strategyId } });
    if (!strategy || !strategy.actionPlan) return null;

    const plan = strategy.actionPlan as unknown as ActionPlanJson;
    const item = plan.items.find((i) => i.id === itemId);
    if (!item) return null;

    if (updates.is_completed !== undefined) {
      item.is_completed = updates.is_completed;
      item.completed_at = updates.is_completed ? new Date().toISOString() : null;
    }

    return tx.strategy.update({
      where: { id: strategyId },
      data: { actionPlan: plan as unknown as Prisma.InputJsonValue },
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

/**
 * Update a specific milestone within the roadmap JSONB.
 */
export async function updateMilestone(
  strategyId: number,
  milestoneId: string,
  updates: { is_completed?: boolean },
) {
  return prisma.$transaction(async (tx) => {
    const strategy = await tx.strategy.findUnique({ where: { id: strategyId } });
    if (!strategy || !strategy.roadmap) return null;

    const roadmap = strategy.roadmap as unknown as RoadmapJson;
    const milestone = roadmap.milestones.find((m) => m.id === milestoneId);
    if (!milestone) return null;

    if (updates.is_completed !== undefined) {
      milestone.is_completed = updates.is_completed;
      milestone.completed_at = updates.is_completed ? new Date().toISOString() : null;
    }

    return tx.strategy.update({
      where: { id: strategyId },
      data: { roadmap: roadmap as unknown as Prisma.InputJsonValue },
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

/**
 * Update a specific micro-task within the microPlan JSONB.
 */
export async function updateMicroTask(
  strategyId: number,
  taskId: string,
  updates: { is_completed?: boolean },
) {
  return prisma.$transaction(async (tx) => {
    const strategy = await tx.strategy.findUnique({ where: { id: strategyId } });
    if (!strategy || !strategy.microPlan) return null;

    const plan = strategy.microPlan as unknown as MicroPlanJson;
    const task = plan.tasks.find((t) => t.id === taskId);
    if (!task) return null;

    if (updates.is_completed !== undefined) {
      task.is_completed = updates.is_completed;
      task.completed_at = updates.is_completed ? new Date().toISOString() : null;
    }

    return tx.strategy.update({
      where: { id: strategyId },
      data: { microPlan: plan as unknown as Prisma.InputJsonValue },
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

/**
 * Flag strategies for refresh when identity score shifts significantly.
 */
export async function flagStrategiesForRefresh(userId: number, tenantId: number) {
  return prisma.strategy.updateMany({
    where: { userId, tenantId, isActive: true },
    data: { needsRefresh: true },
  });
}
