import type { Request, Response } from 'express';
import { forgotPasswordLimiter } from './rate-limiter';

function requestFrom(locale: string | undefined, email: string): Request {
  return { ip: '203.0.113.7', body: { email }, headers: {}, locale, app: { get: () => false } } as unknown as Request;
}

function mockRes() {
  const res = {
    statusCode: 200,
    headersSent: false,
    writableEnded: false,
    setHeader: jest.fn(),
    getHeader: jest.fn(),
    status: jest.fn(function (this: { statusCode: number }, code: number) {
      this.statusCode = code;
      return this;
    }),
    send: jest.fn(),
  };
  return res as typeof res & Response;
}

// Five requests pass, the sixth is refused: its body is what a user would read
async function refusedBody(locale: string | undefined, email: string) {
  let res = mockRes();
  for (let i = 0; i < 6; i++) {
    res = mockRes();
    await forgotPasswordLimiter(requestFrom(locale, email), res, jest.fn());
  }
  expect(res.status).toHaveBeenCalledWith(429);
  return res.send.mock.calls[0][0];
}

describe('rate-limit messages', () => {
  it('are written in the language of the refused request', async () => {
    await expect(refusedBody('fr', 'fr@example.test')).resolves.toEqual({
      error: {
        code: 'RATE_LIMITED',
        message: 'Trop de demandes de réinitialisation du mot de passe. Veuillez réessayer plus tard.',
        details: [],
      },
    });
  });

  it('stay as they were in English, also when the request carries no language', async () => {
    const english = {
      error: { code: 'RATE_LIMITED', message: 'Too many password reset requests. Please try again later.', details: [] },
    };
    await expect(refusedBody('en', 'en@example.test')).resolves.toEqual(english);
    await expect(refusedBody(undefined, 'none@example.test')).resolves.toEqual(english);
  });
});
