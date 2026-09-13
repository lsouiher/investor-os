import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

// Use userId for authenticated endpoints, IP for public endpoints
function userOrIpKey(req: Request): string {
  return (req as Request & { user?: { userId: number } }).user?.userId?.toString() ?? req.ip ?? 'unknown';
}

// Many users share one public IP (a conference venue, an office), so anything that guards a
// per-account action is keyed by IP *and* the account it targets; pure IP limits stay only
// where the account is unknown (registration) and are sized for a room, not a person.
function ipAndEmailKey(req: Request): string {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  return `${req.ip ?? 'unknown'}|${email}`;
}

const rateLimitedMessage = (message: string) => ({
  error: { code: 'RATE_LIMITED', message, details: [] },
});

// Registration: 100 accounts / 15 minutes per IP (a venue's worth), no account to key on yet
export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitedMessage('Too many requests. Please try again later.'),
});

// Login: 10 attempts / 15 minutes per IP + email — brute-force protection that one
// neighbour's typos can't trip for the whole room
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: ipAndEmailKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitedMessage('Too many login attempts. Please try again later.'),
});

// Forgot password: 5 requests / 15 minutes per IP + email
export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: ipAndEmailKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitedMessage('Too many password reset requests. Please try again later.'),
});

// Reset password: 10 attempts / 15 minutes per IP (tokens are 256-bit; this is just a brake)
export const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitedMessage('Too many password reset attempts. Please try again later.'),
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

// Global brake per IP: 600 requests / minute. Runs before authentication, so it can only key
// on IP; sized so fifty people on one venue Wi-Fi each get a normal session, while a single
// abusive client still hits a ceiling.
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitedMessage('Too many requests. Please try again later.'),
});

// Per-user brake: 120 requests / minute, mounted after authentication so the key is the
// account, not the shared IP
export const userLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitedMessage('Too many requests. Please try again later.'),
});
