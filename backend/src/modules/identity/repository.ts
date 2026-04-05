import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/db.js';
import { generatePublicId } from '../../shared/utils/id.js';

// create version (append-only)
export async function createIdentityVersion(data: {
  tenantId: number;
  userId: number;
  archetype: string;
  readinessScore: number;
  subScores: Record<string, number>;
  radarData: Record<string, number>;
  headlineInsight: string;
  aiInsights: Record<string, unknown>;
  auditSnapshot: Record<string, number>;
}) {
  return prisma.$transaction(async (tx) => {
    const latestVersion = await tx.identityVersion.findFirst({
      where: { userId: data.userId, tenantId: data.tenantId },
      orderBy: { version: 'desc' },
    });
    const nextVersion = (latestVersion?.version ?? 0) + 1;

    return tx.identityVersion.create({
      data: {
        publicId: generatePublicId(),
        tenantId: data.tenantId,
        userId: data.userId,
        version: nextVersion,
        archetype: data.archetype,
        readinessScore: data.readinessScore,
        subScores: data.subScores as unknown as Prisma.InputJsonValue,
        radarData: data.radarData as unknown as Prisma.InputJsonValue,
        headlineInsight: data.headlineInsight,
        aiInsights: data.aiInsights as unknown as Prisma.InputJsonValue,
        auditSnapshot: data.auditSnapshot as unknown as Prisma.InputJsonValue,
      },
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function getLatestIdentity(userId: number, tenantId: number) {
  return prisma.identityVersion.findFirst({
    where: { userId, tenantId },
    orderBy: { version: 'desc' },
  });
}

export async function getIdentityHistory(userId: number, tenantId: number) {
  return prisma.identityVersion.findMany({
    where: { userId, tenantId },
    orderBy: { version: 'desc' },
    select: {
      publicId: true,
      version: true,
      archetype: true,
      readinessScore: true,
      generatedAt: true,
    },
  });
}

export async function getIdentityByPublicId(publicId: string, tenantId: number) {
  return prisma.identityVersion.findFirst({
    where: { publicId, tenantId },
  });
}

export async function updateUserRating(identityId: number, rating: number) {
  return prisma.identityVersion.update({
    where: { id: identityId },
    data: { userRating: rating },
  });
}

export async function markIdentityRevealSeen(userId: number) {
  return prisma.user.update({
    where: { id: userId },
    data: { identityRevealSeenAt: new Date() },
  });
}
