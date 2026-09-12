import { TaskSource } from '@prisma/client';
import { AppError } from '../../shared/middleware/error-handler.js';
import * as taskRepo from './repository.js';
import { logTaskCompleted } from '../logging/service.js';

export async function createManualTask(
  userId: number,
  tenantId: number,
  data: {
    title: string;
    description?: string;
    dueDate?: string;
    estimatedMinutes?: number;
  },
) {
  const task = await taskRepo.createTask(tenantId, userId, {
    source: 'manual',
    title: data.title,
    description: data.description,
    dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    estimatedMinutes: data.estimatedMinutes,
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

  return {
    tasks: tasks.map((t) => ({
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
    })),
    pagination: {
      page: filters.page,
      perPage: filters.perPage,
      total,
      totalPages: Math.ceil(total / filters.perPage),
    },
  };
}
