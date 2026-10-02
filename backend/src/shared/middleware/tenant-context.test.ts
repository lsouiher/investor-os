/**
 * Value: protects=a failed RLS set_config reaches the error handler instead of rejecting the
 * middleware's promise (an unhandled rejection stops the Express 4 process); fails_when=the
 * try/catch around $executeRaw is removed; why_new=no test covered setTenantContext; seam=none
 *
 * Regression: found by /ship red team on 2026-10-02 (tenant-context.ts:17).
 * Red proof: the first test failed against ee9af73 (no try/catch: "Received promise rejected
 * instead of resolved") and passes from b0547c4.
 */
const mockExecuteRaw = jest.fn();
jest.mock('../db.js', () => ({ prisma: { $executeRaw: (...args: unknown[]) => mockExecuteRaw(...args) } }));

import type { Request, Response } from 'express';
import { setTenantContext, tenantStorage } from './tenant-context';

const request = (tenantId?: number) => ({ user: tenantId ? { tenantId } : undefined }) as unknown as Request;

describe('setTenantContext', () => {
  beforeEach(() => mockExecuteRaw.mockReset());

  it('hands a database failure to the error handler instead of rejecting', async () => {
    const failure = new Error('Timed out fetching a new connection from the connection pool');
    mockExecuteRaw.mockRejectedValue(failure);
    const next = jest.fn();

    await expect(setTenantContext(request(4), {} as Response, next)).resolves.toBeUndefined();

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(failure);
  });

  it('runs the rest of the request inside the tenant context', async () => {
    mockExecuteRaw.mockResolvedValue(1);
    let seen: number | undefined;
    const next = jest.fn(() => {
      seen = tenantStorage.getStore()?.tenantId;
    });

    await setTenantContext(request(4), {} as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(seen).toBe(4);
  });

  it('passes a request without a tenant straight through', async () => {
    const next = jest.fn();

    await setTenantContext(request(), {} as Response, next);

    expect(mockExecuteRaw).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });
});
