import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { AppError } from './error-handler.js';
import { prisma } from '../db.js';

// Read and validate JWT secret at module load time
const JWT_SECRET = process.env.JWT_SECRET!;
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required.');
}

// Zod schema for runtime validation of JWT payload (publicId-only, no internal IDs)
const JwtPayloadSchema = z.object({
  sub: z.string(),
  email: z.string(),
  role: z.enum(['investor', 'admin']),
  iat: z.number(),
});

export interface AuthPayload {
  userId: number;
  publicId: string;
  tenantId: number;
  email: string;
  role: 'investor' | 'admin';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

// Express 4 does not catch a promise rejected by async middleware: a failure has to reach the
// error handler through next(err), otherwise the unhandled rejection stops the process.
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    await identify(req);
  } catch (err) {
    next(err);
    return;
  }
  next();
}

async function identify(req: Request): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw AppError.localized('UNAUTHORIZED', 'auth.required', {}, 401);
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const parsed = JwtPayloadSchema.safeParse(decoded);
    if (!parsed.success) {
      throw AppError.localized('UNAUTHORIZED', 'auth.token_payload_invalid', {}, 401);
    }

    // Resolve internal IDs from publicId (no internal IDs in JWT)
    const user = await prisma.user.findFirst({
      where: { publicId: parsed.data.sub, deletedAt: null },
      select: { id: true, publicId: true, tenantId: true, email: true, role: true, locale: true, tokenInvalidatedAt: true },
    });

    if (!user) {
      throw AppError.localized('UNAUTHORIZED', 'auth.user_not_found', {}, 401);
    }

    // Reject JWTs issued before password reset
    if (user.tokenInvalidatedAt) {
      const issuedAt = new Date(parsed.data.iat * 1000);
      if (issuedAt < user.tokenInvalidatedAt) {
        throw AppError.localized('UNAUTHORIZED', 'auth.token_invalidated', {}, 401);
      }
    }

    req.user = {
      userId: user.id,
      publicId: user.publicId,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    };
    // Signed in: the account's language wins over the one the request announced
    req.locale = user.locale;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw AppError.localized('UNAUTHORIZED', 'auth.token_invalid', {}, 401);
  }
}
