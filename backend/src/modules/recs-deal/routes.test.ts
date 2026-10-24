/**
 * Contract tests for /api/v1/recs-deals (contracts/recs-deals-api.md). The repository is mocked;
 * its tenant and user filters are pinned by repository.test.ts.
 */
import express from 'express';
import request from 'supertest';

const mockCreate = jest.fn();
const mockList = jest.fn();
const mockSoftDelete = jest.fn();
const mockCount = jest.fn();
jest.mock('./repository.js', () => ({
  createRecsDeal: (...args: unknown[]) => mockCreate(...args),
  listRecsDeals: (...args: unknown[]) => mockList(...args),
  softDeleteRecsDeal: (...args: unknown[]) => mockSoftDelete(...args),
  countLiveRecsDeals: (...args: unknown[]) => mockCount(...args),
}));

import recsDealRoutes from './routes';
import { snakeCaseResponse } from '../../shared/middleware/snake-case-response';
import { errorHandler } from '../../shared/middleware/error-handler';

const CREATED_AT = new Date('2026-12-05T10:00:00.000Z');
const VALID = { c: 'multifamily', name: 'Elm St 12-plex', d: 'N4IgLgpgdg5g_-' };

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  req.user = { userId: 1, publicId: 'u1', tenantId: 7, email: 'a@example.com', role: 'investor' };
  next();
});
app.use(snakeCaseResponse);
app.use('/recs-deals', recsDealRoutes);
app.use(errorHandler);

function row(overrides: Record<string, unknown> = {}) {
  return { id: 10, publicId: 'pub10', tenantId: 7, userId: 1, ...VALID, createdAt: CREATED_AT, deletedAt: null, ...overrides };
}

beforeEach(() => {
  mockCount.mockResolvedValue(0);
  mockCreate.mockImplementation(async (_t: number, _u: number, input: typeof VALID) => row(input));
});

describe('POST /recs-deals', () => {
  // Security review (cso 89b18400): one account cannot grow the table without bound
  it('refuses the 501st live deal of a user with 400 on field limit, and stores nothing', async () => {
    mockCount.mockResolvedValue(500);
    const res = await request(app).post('/recs-deals').send(VALID);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual([expect.objectContaining({ field: 'limit' })]);
    expect(mockCount).toHaveBeenCalledWith(1, 7);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('saves the 500th live deal', async () => {
    mockCount.mockResolvedValue(499);
    expect((await request(app).post('/recs-deals').send(VALID)).status).toBe(201);
  });

  it('saves a deal and returns 201 with id, c, name, created_at', async () => {
    const res = await request(app).post('/recs-deals').send({ ...VALID, name: '  Elm St 12-plex ' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      data: { id: 'pub10', c: 'multifamily', name: 'Elm St 12-plex', created_at: '2026-12-05T10:00:00.000Z' },
    });
    expect(mockCreate).toHaveBeenCalledWith(7, 1, VALID);
  });

  it('passes d to the repository unchanged', async () => {
    const d = 'aZ09_-'.repeat(1000);
    await request(app).post('/recs-deals').send({ ...VALID, d });
    expect(mockCreate.mock.calls[0][2].d).toBe(d);
  });

  it('stores the cleaned name', async () => {
    const res = await request(app).post('/recs-deals').send({ ...VALID, name: 'Elm\tSt‮' });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Elm St');
  });

  it('accepts 120 emoji', async () => {
    const res = await request(app).post('/recs-deals').send({ ...VALID, name: '🏠'.repeat(120) });
    expect(res.status).toBe(201);
  });

  it.each([
    ['unknown slug', { c: 'nope' }, 'c'],
    ['missing c', { c: undefined }, 'c'],
    ['name of spaces', { name: '   ' }, 'name'],
    ['121-code-point name', { name: 'a'.repeat(121) }, 'name'],
    ['8,001-char d', { d: 'a'.repeat(8001) }, 'd'],
    ['d with +', { d: 'a+b' }, 'd'],
    ['d with /', { d: 'a/b' }, 'd'],
    ['d with =', { d: 'ab=' }, 'd'],
    ['d with a space', { d: 'a b' }, 'd'],
  ])('rejects %s with 400 on field', async (_label, override, field) => {
    const res = await request(app).post('/recs-deals').send({ ...VALID, ...override });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details[0].field).toBe(field);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('does not deduplicate: two identical posts make two rows', async () => {
    await request(app).post('/recs-deals').send(VALID);
    await request(app).post('/recs-deals').send(VALID);
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });
});

describe('GET /recs-deals', () => {
  it('returns the live deals in repository order with d as stored', async () => {
    const d = 'stored_payload-1';
    mockList.mockResolvedValue([
      row({ publicId: 'new', d }),
      row({ publicId: 'old', c: 'brrrr', createdAt: new Date('2026-12-01T00:00:00.000Z') }),
    ]);
    const res = await request(app).get('/recs-deals');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([
      { id: 'new', c: 'multifamily', name: 'Elm St 12-plex', d, created_at: '2026-12-05T10:00:00.000Z' },
      { id: 'old', c: 'brrrr', name: 'Elm St 12-plex', d: VALID.d, created_at: '2026-12-01T00:00:00.000Z' },
    ]);
    expect(mockList).toHaveBeenCalledWith(1, 7);
  });

  it('returns an empty list', async () => {
    mockList.mockResolvedValue([]);
    const res = await request(app).get('/recs-deals');
    expect(res.body).toEqual({ data: [] });
  });
});

describe('DELETE /recs-deals/:id', () => {
  it('soft-deletes the caller\'s deal by public id, user and tenant, 204', async () => {
    mockSoftDelete.mockResolvedValue(1);
    const res = await request(app).delete('/recs-deals/pub10');
    expect(res.status).toBe(204);
    expect(res.text).toBe('');
    expect(mockSoftDelete).toHaveBeenCalledWith('pub10', 1, 7);
  });

  it('answers 404 when no live deal of the caller matches (absent, deleted or another user)', async () => {
    mockSoftDelete.mockResolvedValue(0);
    const res = await request(app).delete('/recs-deals/someone-elses');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  // Also the race: of two deletes at once, the database applies one and the other matches nothing
  it('answers 204 then 404 when deleting twice', async () => {
    mockSoftDelete.mockResolvedValueOnce(1).mockResolvedValueOnce(0);
    expect((await request(app).delete('/recs-deals/pub10')).status).toBe(204);
    expect((await request(app).delete('/recs-deals/pub10')).status).toBe(404);
  });
});
