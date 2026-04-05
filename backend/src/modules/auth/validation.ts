import { AppError } from '../../shared/middleware/error-handler.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

export function validateEmail(email: unknown): string {
  if (typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid email format.', 400, [
      { field: 'email', message: 'Must be a valid email address.' },
    ]);
  }
  return email.toLowerCase().trim();
}

export function validatePassword(password: unknown): string {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw new AppError('VALIDATION_ERROR', 'Password too short.', 400, [
      { field: 'password', message: `Must be at least ${MIN_PASSWORD_LENGTH} characters.` },
    ]);
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new AppError('VALIDATION_ERROR', 'Password too long.', 400, [
      { field: 'password', message: `Must be at most ${MAX_PASSWORD_LENGTH} characters.` },
    ]);
  }
  return password;
}

export function validateRegisterInput(body: Record<string, unknown>): { email: string; password: string } {
  return {
    email: validateEmail(body.email),
    password: validatePassword(body.password),
  };
}

export function validateLoginInput(body: Record<string, unknown>): { email: string; password: string } {
  return {
    email: validateEmail(body.email),
    password: validatePassword(body.password),
  };
}

export function validateResetPasswordInput(body: Record<string, unknown>): { token: string; password: string } {
  if (typeof body.token !== 'string' || body.token.length === 0) {
    throw new AppError('VALIDATION_ERROR', 'Reset token is required.', 400);
  }
  return {
    token: body.token,
    password: validatePassword(body.password),
  };
}
