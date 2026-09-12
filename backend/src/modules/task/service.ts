import { TaskSource } from '@prisma/client';
import { AppError } from '../../shared/middleware/error-handler.js';
import * as taskRepo from './repository.js';
import * as strategyRepo from '../strategy/repository.js';
import type { ActionPlanJson } from '../strategy/types.js';
import { logTaskCompleted } from '../logging/service.js';

export interface TaskView {
  id: string;
  source: TaskSource | 'strategy';
  title: string;
  description: string | null;
  identityImpactScore: number | null;
  estimatedMinutes: number | null;
  dueDate: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
  strategyId?: string;
}

/**
 * The active strategy's action plan items, presented as tasks. They live in the strategy's
 * action_plan JSON (single source of truth) — completion goes through
 * PUT /strategies/action-items/:id, which is why the id is the action item id.
 */
export async function listStrategyActionTasks(userId: number, tenantId: number): Promise<TaskView[]> {
  const active = await strategyRepo.getActiveStrategy(userId, tenantId);
  const plan = active?.actionPlan as ActionPlanJson | null | undefined;
  if (!active || !plan?.items?.length) return [];
  const created = active.createdAt.toISOString();
  return [...plan.items]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item, idx) => ({
      id: item.id,
      source: 'strategy' as const,
      title: item.title,
      description: item.description ?? null,
      // Earlier items in the plan carry more identity impact
      identityImpactScore: Math.max(50, 95 - idx * 5),
      estimatedMinutes: null,
      dueDate: null,
      isCompleted: item.is_completed,
      completedAt: item.completed_at ?? null,
      createdAt: created,
      strategyId: active.publicId,
    }));
}

export async function createManualTask(
  userId: number,
  tenantId: number,
  data: {
    title: string;
    description?: string;
    dueDate?: string;
    estimatedMinutes?: number;
    identityImpactScore?: number;
  },
) {
  const task = await taskRepo.createTask(tenantId, userId, {
    source: 'manual',
    title: data.title,
    description: data.description,
    dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    estimatedMinutes: data.estimatedMinutes,
    identityImpactScore: data.identityImpactScore,
  });

  return {
    id: task.publicId,
    source: task.source,
    title: task.title,
    description: task.description,
    identityImpactScore: task.identityImpactScore,
    estimatedMinutes: task.estimatedMinutes,
    dueDate: task.dueDate?.toISOString() ?? null,
    isCompleted: task.isCompleted,
    completedAt: task.completedAt?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
  };
}

export async function updateTask(
  userId: number,
  tenantId: number,
  taskPublicId: string,
  data: {
    title?: string;
    description?: string;
    dueDate?: string | null;
    isCompleted?: boolean;
    estimatedMinutes?: number;
  },
) {
  const existing = await taskRepo.findTaskByPublicId(taskPublicId, tenantId);
  if (!existing || existing.userId !== userId) {
    throw new AppError('NOT_FOUND', 'Task not found.', 404);
  }

  const task = await taskRepo.updateTask(existing.id, tenantId, {
    title: data.title,
    description: data.description,
    dueDate: data.dueDate === null ? null : data.dueDate ? new Date(data.dueDate) : undefined,
    isCompleted: data.isCompleted,
    estimatedMinutes: data.estimatedMinutes,
  });

  // Fire-and-forget: log task completion (don't block the response)
  if (data.isCompleted && task.isCompleted) {
    logTaskCompleted({ tenantId, userId }, task.publicId).catch(() => {});
  }

  return {
    id: task.publicId,
    source: task.source,
    title: task.title,
    description: task.description,
    identityImpactScore: task.identityImpactScore,
    estimatedMinutes: task.estimatedMinutes,
    dueDate: task.dueDate?.toISOString() ?? null,
    isCompleted: task.isCompleted,
    completedAt: task.completedAt?.toISOString() ?? null,
    updatedAt: task.updatedAt.toISOString(),
  };
}

export async function deleteTask(userId: number, tenantId: number, taskPublicId: string) {
  const existing = await taskRepo.findTaskByPublicId(taskPublicId, tenantId);
  if (!existing || existing.userId !== userId) {
    throw new AppError('NOT_FOUND', 'Task not found.', 404);
  }

  await taskRepo.softDeleteTask(existing.id, tenantId);
}

export async function listTasks(
  userId: number,
  tenantId: number,
  filters: {
    isCompleted?: boolean;
    source?: TaskSource;
    page: number;
    perPage: number;
  },
) {
  const { tasks, total } = await taskRepo.listTasks(userId, tenantId, filters);

  const stored: TaskView[] = tasks.map((t) => ({
    id: t.publicId,
    source: t.source,
    title: t.title,
    description: t.description,
    identityImpactScore: t.identityImpactScore,
    estimatedMinutes: t.estimatedMinutes,
    dueDate: t.dueDate?.toISOString() ?? null,
    isCompleted: t.isCompleted,
    completedAt: t.completedAt?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
  }));

  // Merge in the active strategy's action items (first page only, no source filter)
  let strategyTasks: TaskView[] = [];
  if (!filters.source && filters.page === 1) {
    strategyTasks = (await listStrategyActionTasks(userId, tenantId)).filter(
      (t) => filters.isCompleted === undefined || t.isCompleted === filters.isCompleted,
    );
  }

  const merged = [...strategyTasks, ...stored].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
    return (b.identityImpactScore ?? 0) - (a.identityImpactScore ?? 0);
  });

  return {
    tasks: merged,
    pagination: {
      page: filters.page,
      perPage: filters.perPage,
      total: total + strategyTasks.length,
      totalPages: Math.ceil((total + strategyTasks.length) / filters.perPage),
    },
  };
}
