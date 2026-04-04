import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { AppError } from '../../shared/middleware/error-handler.js';
import * as authRepo from './repository.js';
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

export async function register(email: string, password: string): Promise<AuthResponse> {
  const existing = await authRepo.findUserByEmail(email);
  if (existing) {
    throw new AppError('VALIDATION_ERROR', 'Email already registered.', 400);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const { user } = await authRepo.createUserWithTenant(email, passwordHash);
  const token = generateToken(user);

  return {
    user: { id: user.publicId, email: user.email, role: user.role },
    token,
  };
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const user = await authRepo.findUserByEmail(email);
  if (!user || user.deletedAt) {
    throw new AppError('UNAUTHORIZED', 'Invalid email or password.', 401);
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    throw new AppError('UNAUTHORIZED', 'Invalid email or password.', 401);
  }

  await authRepo.updateLastLogin(user.id);
  const token = generateToken(user);

  return {
    user: { id: user.publicId, email: user.email, role: user.role },
    token,
  };
}

export async function getProfile(userId: number): Promise<UserProfile> {
  const user = await authRepo.findUserById(userId);
  if (!user) {
    throw new AppError('NOT_FOUND', 'User not found.', 404);
  }

  return {
    id: user.publicId,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
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

  // TODO: Send email via Resend with reset link containing token
  // For now, log the token in development
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[DEV] Password reset token for ${email}: ${token}`);
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const resetToken = await authRepo.findValidResetToken(token);
  if (!resetToken) {
    throw new AppError('VALIDATION_ERROR', 'Invalid or expired reset token.', 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await authRepo.updatePassword(resetToken.userId, passwordHash);
  await authRepo.markResetTokenUsed(resetToken.id);
}
