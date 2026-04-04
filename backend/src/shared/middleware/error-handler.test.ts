import { AppError, errorHandler, type ErrorCode } from './error-handler';
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

  it('does not leak error details for unknown errors', () => {
    const res = mockRes();
    const err = new Error('SECRET: database connection string');
    errorHandler(err, req, res, next);

    const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
    expect(jsonCall.error.message).toBe('An unexpected error occurred.');
    expect(jsonCall.error.message).not.toContain('SECRET');
  });
});
