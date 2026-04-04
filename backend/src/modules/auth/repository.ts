import { prisma } from '../../shared/db.js';
import { generatePublicId } from '../../shared/utils/id.js';

export async function createUserWithTenant(email: string, passwordHash: string) {
  const tenantPublicId = generatePublicId();
  const userPublicId = generatePublicId();

  return prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: { publicId: tenantPublicId },
    });

    const user = await tx.user.create({
      data: {
        publicId: userPublicId,
        tenantId: tenant.id,
        email,
        passwordHash,
      },
    });

    return { user, tenant };
  });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: { tenant: true },
  });
}

export async function findUserById(id: number) {
  return prisma.user.findFirst({
    where: { id, deletedAt: null },
  });
}

export async function updateLastLogin(userId: number) {
  return prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });
}

export async function createPasswordResetToken(userId: number, token: string, expiresAt: Date) {
  return prisma.passwordResetToken.create({
    data: { userId, token, expiresAt },
  });
}

export async function findValidResetToken(token: string) {
  return prisma.passwordResetToken.findFirst({
    where: {
      token,
      expiresAt: { gt: new Date() },
      usedAt: null,
    },
    include: { user: true },
  });
}

export async function markResetTokenUsed(tokenId: number) {
  return prisma.passwordResetToken.update({
    where: { id: tokenId },
    data: { usedAt: new Date() },
  });
}

export async function updatePassword(userId: number, passwordHash: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}
