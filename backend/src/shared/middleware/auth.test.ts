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
    const token = jwt.sign({ sub: 'nobody' }, 'test-secret');
    const next = await run(`Bearer ${token}`);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });
});
