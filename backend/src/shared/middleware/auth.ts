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

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  // Async middleware: Express 4 does not catch a rejected promise, so every failure goes to
  // next(err). A throw here would be an unhandled rejection and stop the process.
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next(new AppError('UNAUTHORIZED', 'Authentication required.', 401));
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const parsed = JwtPayloadSchema.safeParse(decoded);
    if (!parsed.success) {
      throw new AppError('UNAUTHORIZED', 'Invalid token payload.', 401);
    }

    // Resolve internal IDs from publicId (no internal IDs in JWT)
    const user = await prisma.user.findFirst({
      where: { publicId: parsed.data.sub, deletedAt: null },
      select: { id: true, publicId: true, tenantId: true, email: true, role: true, tokenInvalidatedAt: true },
    });

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'User not found.', 401);
    }

    // Reject JWTs issued before password reset
    if (user.tokenInvalidatedAt) {
      const issuedAt = new Date(parsed.data.iat * 1000);
      if (issuedAt < user.tokenInvalidatedAt) {
        throw new AppError('UNAUTHORIZED', 'Token has been invalidated. Please log in again.', 401);
      }
    }

    req.user = {
      userId: user.id,
      publicId: user.publicId,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    };
  } catch (err) {
    // Only a bad token is a 401 (the web app deletes its token on a 401). Anything else, such as
    // a database failure, is a server error: answering 401 would sign out every active user.
    if (err instanceof AppError) next(err);
    else if (err instanceof jwt.JsonWebTokenError) next(new AppError('UNAUTHORIZED', 'Invalid or expired token.', 401));
    else next(err);
    return;
  }
  next();
}
