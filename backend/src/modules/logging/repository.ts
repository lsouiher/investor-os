import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/db.js';

export async function createActivityLog(data: {
  tenantId: number;
  userId?: number;
  eventType: string;
  payload?: Prisma.InputJsonValue;
}) {
  return prisma.activityLog.create({
    data: {
      tenantId: data.tenantId,
      userId: data.userId ?? null,
      eventType: data.eventType,
      payload: data.payload ?? Prisma.JsonNull,
    },
  });
}
