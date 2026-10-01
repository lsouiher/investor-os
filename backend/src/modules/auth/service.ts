import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { AppError } from '../../shared/middleware/error-handler.js';
import * as authRepo from './repository.js';
import { sendPasswordResetEmail } from '../../shared/email.js';
import { DEFAULT_LOCALE, type Locale } from '../../shared/i18n.js';
import type { AuthResponse, UserProfile } from './types.js';

const SALT_ROUNDS = 12;
const RESET_TOKEN_EXPIRY_HOURS = 1;

function generateToken(user: { publicId: string; email: string; role: string }): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new AppError('INTERNAL_ERROR', 'JWT secret not configured.', 500);

  const payload = {
    sub: user.publicId,
    email: user.email,
    role: user.role,
  };

  const options: SignOptions = { expiresIn: '24h' };
  return jwt.sign(payload, secret, options);
}

export async function register(
  email: string,
  password: string,
  signupSource: string | null = null,
  locale: Locale = DEFAULT_LOCALE,
): Promise<AuthResponse> {
  const existing = await authRepo.findUserByEmail(email);
  if (existing) {
    throw AppError.localized('VALIDATION_ERROR', 'auth.email_taken', {}, 400);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const { user } = await authRepo.createUserWithTenant(email, passwordHash, signupSource, locale);
  const token = generateToken(user);

  return {
    user: { id: user.publicId, email: user.email, role: user.role, locale: user.locale },
    token,
  };
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const user = await authRepo.findUserByEmail(email);
  if (!user || user.deletedAt) {
    throw AppError.localized('UNAUTHORIZED', 'auth.invalid_credentials', {}, 401);
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    throw AppError.localized('UNAUTHORIZED', 'auth.invalid_credentials', {}, 401);
  }

  await authRepo.updateLastLogin(user.id);
  const token = generateToken(user);

  return {
    user: { id: user.publicId, email: user.email, role: user.role, locale: user.locale },
    token,
  };
}

function toProfile(user: { publicId: string; email: string; role: string; locale: Locale; createdAt: Date }): UserProfile {
  return {
    id: user.publicId,
    email: user.email,
    role: user.role,
    locale: user.locale,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function getProfile(userId: number): Promise<UserProfile> {
  const user = await authRepo.findUserById(userId);
  if (!user) {
    throw AppError.localized('NOT_FOUND', 'auth.user_not_found', {}, 404);
  }

  return toProfile(user);
}

// The user's own preferences. Today that is the language; it applies on every device after
// sign-in and to everything generated or sent for the account.
export async function updateProfile(userId: number, changes: { locale: Locale }): Promise<UserProfile> {
  const user = await authRepo.updateUserLocale(userId, changes.locale);
  return toProfile(user);
}

export async function forgotPassword(email: string): Promise<void> {
  const user = await authRepo.findUserByEmail(email);
  if (!user || user.deletedAt) {
    // Always return success to prevent email enumeration
    return;
  }

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
  await authRepo.createPasswordResetToken(user.id, token, expiresAt);

  await sendPasswordResetEmail(user.email, token);
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const resetToken = await authRepo.findValidResetToken(token);
  if (!resetToken) {
    throw AppError.localized('VALIDATION_ERROR', 'auth.reset_token_invalid', {}, 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await authRepo.updatePassword(resetToken.userId, passwordHash);
  await authRepo.markResetTokenUsed(resetToken.id);
}
