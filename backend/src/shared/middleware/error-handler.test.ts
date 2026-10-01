import { AppError, deferredMessage, errorHandler, type ErrorCode } from './error-handler';
import { Request, Response } from 'express';

function mockRes(): Response {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

describe('AppError', () => {
  it('creates an error with code, message, and statusCode', () => {
    const err = new AppError('VALIDATION_ERROR', 'Bad input', 400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.message).toBe('Bad input');
    expect(err.statusCode).toBe(400);
    expect(err.details).toEqual([]);
    expect(err.name).toBe('AppError');
  });

  it('stores details array', () => {
    const details = [{ field: 'email', message: 'Invalid' }];
    const err = new AppError('VALIDATION_ERROR', 'Bad input', 400, details);
    expect(err.details).toEqual(details);
  });

  it('defaults statusCode to 500', () => {
    const err = new AppError('INTERNAL_ERROR', 'Oops');
    expect(err.statusCode).toBe(500);
  });
});

describe('AppError.localized', () => {
  it('keeps the English text in message and details, for logs', () => {
    const err = AppError.localized('VALIDATION_ERROR', 'auth.password_too_short', {}, 400, [
      { field: 'password', message: { key: 'auth.password_min_detail', params: { min: 8 } } },
    ]);
    expect(err).toBeInstanceOf(AppError);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('Password too short.');
    expect(err.details).toEqual([{ field: 'password', message: 'Must be at least 8 characters.' }]);
  });

  it('defaults statusCode to 500 and details to an empty list', () => {
    const err = AppError.localized('INTERNAL_ERROR', 'error.internal');
    expect(err.statusCode).toBe(500);
    expect(err.details).toEqual([]);
  });

  it('renders the message, its parameters and its details in the requested language', () => {
    const err = AppError.localized('VALIDATION_ERROR', 'growth.coming_soon_generate', { path: { key: 'path.skills_knowledge' } }, 400, [
      { unlock_criteria: { key: 'growth.unlock_criteria.coming_soon' }, requires_consent: true },
    ]);
    expect(err.render('en')).toEqual({
      message: 'Skills & Knowledge is coming soon and not yet available for generation.',
      details: [{ unlock_criteria: 'Coming soon — this path will be available in a future update', requires_consent: true }],
    });
    const french = err.render('fr');
    expect(french.message).toContain('Compétences et connaissances');
    expect(french.details).toEqual([
      { unlock_criteria: 'Bientôt disponible\u00a0: ce parcours arrivera dans une prochaine mise à jour', requires_consent: true },
    ]);
  });

  it('renders a plain AppError as written, whatever the language', () => {
    const err = new AppError('VALIDATION_ERROR', 'Invalid role_type.', 400, [{ field: 'role_type' }]);
    expect(err.render('fr')).toEqual({ message: 'Invalid role_type.', details: [{ field: 'role_type' }] });
  });
});

describe('deferredMessage', () => {
  it('keeps the key of a localized error, the text of a plain one, and the fallback for anything else', () => {
    expect(deferredMessage(AppError.localized('RATE_LIMITED', 'simulation.daily_limit', { max: 3 }, 429), 'ai.unavailable')).toEqual({
      key: 'simulation.daily_limit',
      params: { max: 3 },
    });
    expect(deferredMessage(new AppError('INTERNAL_ERROR', 'No active prompt template'), 'ai.unavailable')).toBe('No active prompt template');
    expect(deferredMessage(new Error('socket hang up'), 'ai.unavailable')).toEqual({ key: 'ai.unavailable' });
  });
});

describe('errorHandler', () => {
  const req = {} as Request;
  const next = jest.fn();

  it('handles AppError with correct status and shape', () => {
    const res = mockRes();
    const err = new AppError('UNAUTHORIZED', 'Auth required', 401);
    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Auth required',
        details: [],
      },
    });
  });

  it.each<[ErrorCode, number]>([
    ['VALIDATION_ERROR', 400],
    ['UNAUTHORIZED', 401],
    ['FORBIDDEN', 403],
    ['NOT_FOUND', 404],
    ['RATE_LIMITED', 429],
    ['AI_SERVICE_ERROR', 503],
    ['AI_PARSE_ERROR', 503],
    ['INTERNAL_ERROR', 500],
  ])('maps %s to status %d via ERROR_STATUS_MAP', (code, expectedStatus) => {
    const res = mockRes();
    const err = new AppError(code, 'test', 0); // statusCode=0 to test fallback
    errorHandler(err, req, res, next);
    // When statusCode is 0 (falsy), falls back to ERROR_STATUS_MAP
    expect(res.status).toHaveBeenCalledWith(expectedStatus);
  });

  it('handles unknown Error with 500 and generic message', () => {
    const res = mockRes();
    const err = new Error('something broke');
    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred.',
        details: [],
      },
    });
  });

  it('answers a localized error in the language of the request', () => {
    const err = AppError.localized('UNAUTHORIZED', 'auth.invalid_credentials', {}, 401);

    const english = mockRes();
    errorHandler(err, { locale: 'en' } as Request, english, next);
    expect(english.status).toHaveBeenCalledWith(401);
    expect(english.json).toHaveBeenCalledWith({
      error: { code: 'UNAUTHORIZED', message: 'Invalid email or password.', details: [] },
    });

    const french = mockRes();
    errorHandler(err, { locale: 'fr' } as Request, french, next);
    expect(french.status).toHaveBeenCalledWith(401);
    expect(french.json).toHaveBeenCalledWith({
      error: { code: 'UNAUTHORIZED', message: 'Courriel ou mot de passe incorrect.', details: [] },
    });
  });

  it('translates details[].message with the message', () => {
    const res = mockRes();
    const err = AppError.localized('VALIDATION_ERROR', 'auth.password_too_short', {}, 400, [
      { field: 'password', message: { key: 'auth.password_min_detail', params: { min: 8 } } },
    ]);
    errorHandler(err, { locale: 'fr' } as Request, res, next);

    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Mot de passe trop court.',
        details: [{ field: 'password', message: 'Doit contenir au moins 8 caractères.' }],
      },
    });
  });

  it('falls back to English when the request carries no language', () => {
    const res = mockRes();
    errorHandler(AppError.localized('NOT_FOUND', 'contact.not_found', {}, 404), req, res, next);
    expect((res.json as jest.Mock).mock.calls[0][0].error.message).toBe('Contact not found.');
  });

  it('leaves a developer-facing AppError in English for a French request', () => {
    const res = mockRes();
    errorHandler(new AppError('VALIDATION_ERROR', 'Invalid role_type.', 400), { locale: 'fr' } as Request, res, next);
    expect((res.json as jest.Mock).mock.calls[0][0].error.message).toBe('Invalid role_type.');
  });

  it('writes the generic 500 message in the language of the request', () => {
    const res = mockRes();
    errorHandler(new Error('something broke'), { locale: 'fr' } as Request, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'INTERNAL_ERROR', message: 'Une erreur inattendue est survenue.', details: [] },
    });
  });

  // Regression: ISSUE-001 — a malformed or oversized JSON body answered 500 INTERNAL_ERROR in English
  // Found by /qa on 2026-10-01
  // Report: .gstack/qa-reports/run-20261001T130834Z/qa-report-localhost-2026-10-01.md
  it.each([
    ['entity.parse.failed', 400, 'Le corps de la requête n’est pas un JSON valide.'],
    ['entity.too.large', 413, 'Le corps de la requête est trop volumineux.'],
  ])('answers a body-parser %s error with %d in the language of the request', (type, status, message) => {
    const res = mockRes();
    const err = Object.assign(new SyntaxError('Unexpected token b in JSON'), { type, status });
    errorHandler(err, { locale: 'fr' } as Request, res, next);

    expect(res.status).toHaveBeenCalledWith(status);
    expect(res.json).toHaveBeenCalledWith({ error: { code: 'VALIDATION_ERROR', message, details: [] } });
  });

  it('does not leak error details for unknown errors', () => {
    const res = mockRes();
    const err = new Error('SECRET: database connection string');
    errorHandler(err, req, res, next);

    const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
    expect(jsonCall.error.message).toBe('An unexpected error occurred.');
    expect(jsonCall.error.message).not.toContain('SECRET');
  });
});
