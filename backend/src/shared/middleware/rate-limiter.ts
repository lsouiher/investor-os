import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

// Use userId for authenticated endpoints, IP for public endpoints
function userOrIpKey(req: Request): string {
  return (req as Request & { user?: { userId: number } }).user?.userId?.toString() ?? req.ip ?? 'unknown';
}

// Auth endpoints: 10 requests / 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please try again later.',
      details: [],
    },
  },
});

// Forgot password: 3 requests / 15 minutes
export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many password reset requests. Please try again later.',
      details: [],
    },
  },
});

// Reset password: 3 requests / 15 minutes
export const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many password reset attempts. Please try again later.',
      details: [],
    },
  },
});

// Identity synthesis: 5 requests / 5 minutes (keyed by userId)
export const synthesizerLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many synthesis requests. Please try again later.',
      details: [],
    },
  },
});

// Strategy generation: 3 requests / 5 minutes (keyed by userId)
export const strategyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many strategy generation requests. Please try again later.',
      details: [],
    },
  },
});

// Blueprint generation: 5 requests / 1 hour (keyed by userId)
export const blueprintLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many blueprint requests. Please try again later.',
      details: [],
    },
  },
});

// General: 100 requests / 1 minute
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please try again later.',
      details: [],
    },
  },
});
