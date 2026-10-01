import { AppError } from '../../shared/middleware/error-handler.js';
import { SUPPORTED_LOCALES, isLocale, type Locale } from '../../shared/i18n.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

export function validateEmail(email: unknown): string {
  if (typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
    throw AppError.localized('VALIDATION_ERROR', 'auth.email_invalid', {}, 400, [
      { field: 'email', message: { key: 'auth.email_invalid_detail' } },
    ]);
  }
  return email.toLowerCase().trim();
}

export function validatePassword(password: unknown): string {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw AppError.localized('VALIDATION_ERROR', 'auth.password_too_short', {}, 400, [
      { field: 'password', message: { key: 'auth.password_min_detail', params: { min: MIN_PASSWORD_LENGTH } } },
    ]);
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    throw AppError.localized('VALIDATION_ERROR', 'auth.password_too_long', {}, 400, [
      { field: 'password', message: { key: 'auth.password_max_detail', params: { max: MAX_PASSWORD_LENGTH } } },
    ]);
  }
  return password;
}

// Where the signup came from (utm_source captured by the landing page); optional, short,
// and restricted to a slug so it can never carry markup or PII into the funnel report.
export function validateSignupSource(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const slug = value.trim().toLowerCase();
  return /^[a-z0-9_-]{1,32}$/.test(slug) ? slug : null;
}

export function validateLocale(value: unknown): Locale {
  if (!isLocale(value)) {
    throw AppError.localized('VALIDATION_ERROR', 'validation.locale_invalid', {}, 400, [
      { field: 'locale', message: { key: 'validation.locale_options', params: { locales: SUPPORTED_LOCALES.join(', ') } } },
    ]);
  }
  return value;
}

// `locale` is optional at registration: null (missing or unsupported) means "use the
// language of the request", which the route resolves.
export function validateRegisterInput(
  body: Record<string, unknown>,
): { email: string; password: string; signupSource: string | null; locale: Locale | null } {
  return {
    email: validateEmail(body.email),
    password: validatePassword(body.password),
    signupSource: validateSignupSource(body.signup_source),
    locale: isLocale(body.locale) ? body.locale : null,
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
    throw AppError.localized('VALIDATION_ERROR', 'auth.reset_token_required', {}, 400);
  }
  return {
    token: body.token,
    password: validatePassword(body.password),
  };
}
