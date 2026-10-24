import type { RecsDeal } from '@prisma/client';
import { AppError } from '../../shared/middleware/error-handler.js';
import * as recsDealRepo from './repository.js';
import type { RecsDealInput, RecsDealView } from './types.js';

// Live deals one user may keep: far above real use, it stops one account from growing the table
// without bound (rows hold up to 8,000 characters). Count then insert, so concurrent saves can
// pass it by a few; a bound on storage, not an exact quota.
export const MAX_LIVE_DEALS = 500;

export async function createRecsDeal(userId: number, tenantId: number, input: RecsDealInput) {
  if ((await recsDealRepo.countLiveRecsDeals(userId, tenantId)) >= MAX_LIVE_DEALS) {
    const message = `You can keep at most ${MAX_LIVE_DEALS} deals. Delete some, then save again.`;
    throw new AppError('VALIDATION_ERROR', message, 400, [{ field: 'limit', message }]);
  }
  const deal = await recsDealRepo.createRecsDeal(tenantId, userId, input);
  return {
    id: deal.publicId,
    c: deal.c,
    name: deal.name,
    createdAt: deal.createdAt.toISOString(),
  };
}

function toView(deal: RecsDeal): RecsDealView {
  return {
    id: deal.publicId,
    c: deal.c,
    name: deal.name,
    d: deal.d,
    createdAt: deal.createdAt.toISOString(),
  };
}

export async function listRecsDeals(userId: number, tenantId: number): Promise<RecsDealView[]> {
  const deals = await recsDealRepo.listRecsDeals(userId, tenantId);
  return deals.map(toView);
}

export async function deleteRecsDeal(userId: number, tenantId: number, publicId: string) {
  const deleted = await recsDealRepo.softDeleteRecsDeal(publicId, userId, tenantId);
  if (deleted === 0) {
    throw new AppError('NOT_FOUND', 'Deal not found.', 404);
  }
}
