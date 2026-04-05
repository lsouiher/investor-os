import { Request, Response, NextFunction } from 'express';
import { AppError } from './error-handler.js';

export function requireRole(...roles: ('investor' | 'admin')[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Authentication required.', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError('FORBIDDEN', 'Insufficient permissions.', 403);
    }

    next();
  };
}
