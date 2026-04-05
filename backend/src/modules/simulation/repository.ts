import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/db.js';
import { generatePublicId } from '../../shared/utils/id.js';

export async function createSimulation(
  tenantId: number,
  userId: number,
  identityVersionId: number,
  modifiedParameters: Prisma.InputJsonValue,
  resultDelta: Prisma.InputJsonValue,
) {
  return prisma.simulation.create({
    data: {
      publicId: generatePublicId(),
      tenantId,
      userId,
      identityVersionId,
      modifiedParameters,
      resultDelta,
    },
  });
}

export async function getSimulationCountLast24h(userId: number, tenantId: number): Promise<number> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return prisma.simulation.count({
    where: {
      userId,
      tenantId,
      createdAt: { gt: twentyFourHoursAgo },
    },
  });
}

export async function getUserSimulations(userId: number, tenantId: number) {
  return prisma.simulation.findMany({
    where: { userId, tenantId },
    orderBy: { createdAt: 'desc' },
    select: {
      publicId: true,
      modifiedParameters: true,
      resultDelta: true,
      createdAt: true,
      identityVersion: {
        select: {
          publicId: true,
          archetype: true,
          readinessScore: true,
        },
      },
    },
  });
}
