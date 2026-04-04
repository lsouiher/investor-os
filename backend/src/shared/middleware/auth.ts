import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { AppError } from './error-handler.js';

// Fix 6: Read and validate JWT secret at module load time
const JWT_SECRET = process.env.JWT_SECRET!;
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required.');
}

// Fix 2: Zod schema for runtime validation of JWT payload
const AuthPayloadSchema = z.object({
  userId: z.number(),
  publicId: z.string(),
  tenantId: z.number(),
  email: z.string(),
  role: z.enum(['investor', 'admin']),
});

export type AuthPayload = z.infer<typeof AuthPayloadSchema>;

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('UNAUTHORIZED', 'Authentication required.', 401);
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const parsed = AuthPayloadSchema.safeParse(decoded);
    if (!parsed.success) {
      throw new AppError('UNAUTHORIZED', 'Invalid token payload.', 401);
    }
    req.user = parsed.data;
    next();
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('UNAUTHORIZED', 'Invalid or expired token.', 401);
  }
}
