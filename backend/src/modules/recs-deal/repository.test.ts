/**
 * Isolation (spec SC-8): every query is filtered by tenant and user, and deleted rows are never
 * returned. Prisma is mocked; the filters are what is under test.
 */
const mockCreate = jest.fn().mockResolvedValue({});
const mockFindMany = jest.fn().mockResolvedValue([]);
const mockCount = jest.fn().mockResolvedValue(0);
const mockUpdateMany = jest.fn().mockResolvedValue({ count: 1 });

jest.mock('../../shared/db.js', () => ({
  prisma: {
    recsDeal: {
      create: (...args: unknown[]) => mockCreate(...args),
      findMany: (...args: unknown[]) => mockFindMany(...args),
      updateMany: (...args: unknown[]) => mockUpdateMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
    },
  },
}));

import { countLiveRecsDeals, createRecsDeal, listRecsDeals, softDeleteRecsDeal } from './repository';

describe('recs-deal repository', () => {
  it('lists only the live deals of this user and tenant, newest first', async () => {
    await listRecsDeals(3, 9);
    const args = mockFindMany.mock.calls[0][0];
    expect(args.where).toEqual(expect.objectContaining({ tenantId: 9, userId: 3, deletedAt: null }));
    expect(args.orderBy).toEqual({ createdAt: 'desc' });
  });

  // One statement, so two deletes at once cannot both pass a lookup and then race on the write
  it('soft-deletes by public id only for this user and tenant, and only if live, in one statement', async () => {
    await expect(softDeleteRecsDeal('pub', 3, 9)).resolves.toBe(1);
    const args = mockUpdateMany.mock.calls[0][0];
    expect(args.where).toEqual(expect.objectContaining({ publicId: 'pub', userId: 3, tenantId: 9, deletedAt: null }));
    expect(args.data.deletedAt).toBeInstanceOf(Date);
  });

  it('counts only the live deals of this user and tenant', async () => {
    await countLiveRecsDeals(3, 9);
    expect(mockCount.mock.calls[0][0].where).toEqual({ tenantId: 9, userId: 3, deletedAt: null });
  });

  it('creates with a public id and d unchanged', async () => {
    const d = 'N4Ig_-'.repeat(500);
    await createRecsDeal(9, 3, { c: 'brrrr', name: 'Elm', d });
    const { data } = mockCreate.mock.calls[0][0];
    expect(data).toEqual(expect.objectContaining({ tenantId: 9, userId: 3, c: 'brrrr', name: 'Elm', d }));
    expect(typeof data.publicId).toBe('string');
    expect(data.publicId.length).toBeGreaterThan(10);
  });
});
