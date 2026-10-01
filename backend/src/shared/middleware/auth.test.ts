process.env.JWT_SECRET = 'test-secret';

import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error-handler';

const findFirst = jest.fn();
jest.mock('../db.js', () => ({ prisma: { user: { findFirst: (...args: unknown[]) => findFirst(...args) } } }));

// Required, not imported: auth.ts reads JWT_SECRET when it loads, so it must load after the line above
const { authenticate } = require('./auth') as typeof import('./auth');

function requestWith(authorization?: string): Request {
  return { headers: { authorization }, locale: 'en' } as unknown as Request;
}

const account = { id: 7, publicId: 'pub_7', tenantId: 3, email: 'a@b.co', role: 'investor', locale: 'fr', tokenInvalidatedAt: null };
const tokenFor = (sub: string) => jwt.sign({ sub, email: 'a@b.co', role: 'investor' }, 'test-secret');

describe('authenticate', () => {
  it('sets the user and the account language on the request', async () => {
    findFirst.mockResolvedValue(account);
    const req = requestWith(`Bearer ${tokenFor('pub_7')}`);
    const next = jest.fn();

    await authenticate(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user).toEqual({ userId: 7, publicId: 'pub_7', tenantId: 3, email: 'a@b.co', role: 'investor' });
    expect(req.locale).toBe('fr');
  });

  // A rejected promise from async middleware is not caught by Express 4 and stops the process
  it.each([
    ['no Authorization header', undefined],
    ['a malformed token', 'Bearer not-a-jwt'],
    ['a token signed with another secret', `Bearer ${jwt.sign({ sub: 'pub_7', email: 'a@b.co', role: 'investor' }, 'other')}`],
  ])('hands a 401 to the error handler for %s instead of rejecting', async (_label, authorization) => {
    const next = jest.fn();

    await expect(authenticate(requestWith(authorization), {} as Response, next)).resolves.toBeUndefined();

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0] as AppError;
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
  });

  it('rejects a token whose user no longer exists, and one issued before a password reset', async () => {
    const next = jest.fn();
    findFirst.mockResolvedValueOnce(null);
    await authenticate(requestWith(`Bearer ${tokenFor('gone')}`), {} as Response, next);
    findFirst.mockResolvedValueOnce({ ...account, tokenInvalidatedAt: new Date(Date.now() + 60_000) });
    await authenticate(requestWith(`Bearer ${tokenFor('pub_7')}`), {} as Response, next);

    expect(next).toHaveBeenCalledTimes(2);
    for (const [err] of next.mock.calls) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(401);
    }
  });
});
