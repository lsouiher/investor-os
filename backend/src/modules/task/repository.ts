import { TaskSource } from '@prisma/client';
import { prisma } from '../../shared/db.js';
import { generatePublicId } from '../../shared/utils/id.js';

export async function createTask(
  tenantId: number,
  userId: number,
  data: {
    source: TaskSource;
    title: string;
    description?: string;
    identityImpactScore?: number;
    estimatedMinutes?: number;
    dueDate?: Date;
  },
) {
  return prisma.task.create({
    data: {
      publicId: generatePublicId(),
      tenantId,
      userId,
      source: data.source,
      title: data.title,
      description: data.description ?? null,
      identityImpactScore: data.identityImpactScore ?? null,
      estimatedMinutes: data.estimatedMinutes ?? null,
      dueDate: data.dueDate ?? null,
    },
  });
}

export async function updateTask(
  taskId: number,
  tenantId: number,
  data: {
    title?: string;
    description?: string;
    dueDate?: Date | null;
    isCompleted?: boolean;
    estimatedMinutes?: number;
  },
) {
  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
  if (data.estimatedMinutes !== undefined) updateData.estimatedMinutes = data.estimatedMinutes;

  if (data.isCompleted !== undefined) {
    updateData.isCompleted = data.isCompleted;
    updateData.completedAt = data.isCompleted ? new Date() : null;
  }

  return prisma.task.update({
    where: { id: taskId, tenantId, deletedAt: null },
    data: updateData,
  });
}

export async function softDeleteTask(taskId: number, tenantId: number) {
  return prisma.task.update({
    where: { id: taskId, tenantId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
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
  const where = {
    userId,
    tenantId,
    deletedAt: null,
    ...(filters.isCompleted !== undefined ? { isCompleted: filters.isCompleted } : {}),
    ...(filters.source ? { source: filters.source } : {}),
  };

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy: [{ isCompleted: 'asc' }, { createdAt: 'desc' }],
      skip: (filters.page - 1) * filters.perPage,
      take: filters.perPage,
    }),
    prisma.task.count({ where }),
  ]);

  return { tasks, total };
}

export async function findTaskByPublicId(publicId: string, tenantId: number) {
  return prisma.task.findFirst({
    where: { publicId, tenantId, deletedAt: null },
  });
}
