import { createHash } from 'crypto';
import { prisma } from '../../shared/db.js';
import { generatePublicId } from '../../shared/utils/id.js';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// Feature flags a brand-new tenant starts with. The Growth Strategy Engine is on for every
// beta signup when GROWTH_STRATEGY_DEFAULT_ENABLED=true; otherwise it stays per-tenant.
function defaultFeatureFlags(): Record<string, boolean> {
  return process.env.GROWTH_STRATEGY_DEFAULT_ENABLED === 'true' ? { growth_strategy_enabled: true } : {};
}

export async function createUserWithTenant(
  email: string,
  passwordHash: string,
  signupSource: string | null = null,
) {
  const tenantPublicId = generatePublicId();
  const userPublicId = generatePublicId();

  return prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: { publicId: tenantPublicId, featureFlags: defaultFeatureFlags() },
    });

    const user = await tx.user.create({
      data: {
        publicId: userPublicId,
        tenantId: tenant.id,
        email,
        passwordHash,
        signupSource,
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
    data: { userId, token: hashToken(token), expiresAt },
  });
}

export async function findValidResetToken(token: string) {
  return prisma.passwordResetToken.findFirst({
    where: {
      token: hashToken(token),
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
    data: { passwordHash, tokenInvalidatedAt: new Date() },
  });
}

export async function findUserByPublicId(publicId: string) {
  return prisma.user.findFirst({
    where: { publicId, deletedAt: null },
    include: { tenant: true },
  });
}
