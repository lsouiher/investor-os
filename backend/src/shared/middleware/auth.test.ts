/**
 * authenticate is async: a throw would be an unhandled rejection that stops the API (Express 4
 * does not catch it), so every failure must reach next(err).
 */
process.env.JWT_SECRET = 'test-secret';

jest.mock('../db.js', () => ({ prisma: { user: { findFirst: jest.fn().mockResolvedValue(null) } } }));

import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate } from './auth';
import { AppError } from './error-handler';

function run(authorization?: string) {
  const req = { headers: authorization ? { authorization } : {} } as Request;
  const next = jest.fn();
  return authenticate(req, {} as Response, next).then(() => next);
}

describe('authenticate', () => {
  it('passes a missing token to next as 401 instead of throwing', async () => {
    const next = await run();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(AppError);
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });

  it('passes an invalid token to next as 401 instead of throwing', async () => {
    const next = await run('Bearer not-a-jwt');
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });

  it('passes a token for an unknown user to next as 401', async () => {
    // A full payload, so the request gets past the schema check to the user lookup
    const token = jwt.sign({ sub: 'nobody', email: 'a@example.com', role: 'investor' }, 'test-secret');
    const next = await run(`Bearer ${token}`);
    const { prisma } = jest.requireMock('../db.js') as { prisma: { user: { findFirst: jest.Mock } } };
    expect(prisma.user.findFirst).toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].statusCode).toBe(401);
    expect(next.mock.calls[0][0].message).toBe('User not found.');
  });

  it('passes a token issued before a password reset to next as 401, without setting req.user', async () => {
    const { prisma } = jest.requireMock('../db.js') as { prisma: { user: { findFirst: jest.Mock } } };
    prisma.user.findFirst.mockResolvedValueOnce({
      id: 42, publicId: 'pub42', tenantId: 7, email: 'a@example.com', role: 'investor',
      tokenInvalidatedAt: new Date(Date.now() + 60_000),
    });
    const token = jwt.sign({ sub: 'pub42', email: 'a@example.com', role: 'investor' }, 'test-secret');
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const next = jest.fn();
    await authenticate(req, {} as Response, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].statusCode).toBe(401);
    expect(next.mock.calls[0][0].message).toMatch(/invalidated/);
    expect(req.user).toBeUndefined();
  });
});

/**
 * Value card
 * protects: the success path after next() moved out of the try block: a valid token sets
 *   req.user from the database row and calls next exactly once, with no error.
 * fails_when: next is called twice (once in try, once after), called with an error on success,
 *   never called (request hangs), or req.user is not populated (every route would crash on
 *   req.user!).
 * why_new: the three existing cases cover only failures; the refactor's risk is the happy path.
 * seam: none (prisma mocked at the db module, as above)
 * no_claim: RLS, rate limits, or the tokenInvalidatedAt branch.
 */
describe('authenticate, valid token', () => {
  it('sets req.user and calls next once with no error', async () => {
    const { prisma } = jest.requireMock('../db.js') as { prisma: { user: { findFirst: jest.Mock } } };
    prisma.user.findFirst.mockResolvedValueOnce({
      id: 42, publicId: 'pub42', tenantId: 7, email: 'a@example.com', role: 'investor', tokenInvalidatedAt: null,
    });
    const token = jwt.sign({ sub: 'pub42', email: 'a@example.com', role: 'investor' }, 'test-secret');
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const next = jest.fn();
    await authenticate(req, {} as Response, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect(req.user).toEqual({ userId: 42, publicId: 'pub42', tenantId: 7, email: 'a@example.com', role: 'investor' });
  });
});
