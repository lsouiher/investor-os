/**
 * setTenantContext is async: a rejected database call would be an unhandled rejection that
 * stops the API (Express 4 does not catch it), so it must reach next(err).
 */
jest.mock('../db.js', () => ({ prisma: { $executeRaw: jest.fn() } }));

import type { Request, Response } from 'express';
import { prisma } from '../db.js';
import { setTenantContext } from './tenant-context';

const executeRaw = prisma.$executeRaw as unknown as jest.Mock;

function run() {
  const req = { user: { tenantId: 7 } } as unknown as Request;
  const next = jest.fn();
  return setTenantContext(req, {} as Response, next).then(() => next);
}

describe('setTenantContext', () => {
  beforeEach(() => executeRaw.mockReset());

  it('passes a database failure to next instead of rejecting', async () => {
    const failure = new Error('connection terminated');
    executeRaw.mockRejectedValue(failure);
    const next = await run();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(failure);
  });

  it('calls next once with no error when the tenant is set', async () => {
    executeRaw.mockResolvedValue(1);
    const next = await run();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });
});
