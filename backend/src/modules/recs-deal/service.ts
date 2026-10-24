import type { RecsDeal } from '@prisma/client';
import { AppError } from '../../shared/middleware/error-handler.js';
import * as recsDealRepo from './repository.js';
import type { RecsDealInput, RecsDealView } from './types.js';

export async function createRecsDeal(userId: number, tenantId: number, input: RecsDealInput) {
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
