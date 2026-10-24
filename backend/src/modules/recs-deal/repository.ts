import { prisma } from '../../shared/db.js';
import { generatePublicId } from '../../shared/utils/id.js';
import type { RecsDealInput } from './types.js';

export async function createRecsDeal(tenantId: number, userId: number, input: RecsDealInput) {
  return prisma.recsDeal.create({
    data: {
      publicId: generatePublicId(),
      tenantId,
      userId,
      c: input.c,
      name: input.name,
      d: input.d,
    },
  });
}

export async function listRecsDeals(userId: number, tenantId: number) {
  return prisma.recsDeal.findMany({
    where: { tenantId, userId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
}

// Filters by user as well as tenant: another user's deal, or a deleted one, is not matched.
// One statement, so two deletes at once cannot both pass a lookup; returns the rows changed.
export async function softDeleteRecsDeal(publicId: string, userId: number, tenantId: number) {
  const { count } = await prisma.recsDeal.updateMany({
    where: { publicId, userId, tenantId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return count;
}
