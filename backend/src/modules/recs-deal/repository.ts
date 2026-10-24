import { prisma } from '../../shared/db.js';
import { generatePublicId } from '../../shared/utils/id.js';
import type { RecsDealInput } from './types.js';

export async function createRecsDeal(userId: number, tenantId: number, input: RecsDealInput) {
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

export async function countLiveRecsDeals(userId: number, tenantId: number) {
  return prisma.recsDeal.count({ where: { tenantId, userId, deletedAt: null } });
}

// gstack-shortcut(dec-f8c385f4-318e-477f-a8ec-93db7c038e62): returns every payload (~8 KB each), upgrade when T041 shows the hub GET
// over 200 ms p95 or 500 KB at 100 deals
export async function listRecsDeals(userId: number, tenantId: number) {
  return prisma.recsDeal.findMany({
    where: { tenantId, userId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
}

// Filters by user as well as tenant: another user's deal, or a deleted one, is not matched.
// One statement, so two deletes at once cannot both pass a lookup; returns the rows changed.
// The name and payload are blanked, as account erasure does: the per-user cap counts live deals
// only, so a deleted row must not keep 8,000 characters.
export async function softDeleteRecsDeal(publicId: string, userId: number, tenantId: number) {
  const { count } = await prisma.recsDeal.updateMany({
    where: { publicId, userId, tenantId, deletedAt: null },
    data: { deletedAt: new Date(), name: 'deleted', d: '' },
  });
  return count;
}
