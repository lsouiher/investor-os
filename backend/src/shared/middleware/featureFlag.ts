import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../db.js';
import { AppError } from './error-handler.js';

/**
 * Middleware that gates access behind a tenant-level feature flag.
 * Returns 404 (not 403) when the flag is off — the feature simply doesn't exist for this tenant.
 */
export function requireFeatureFlag(flag: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new AppError('NOT_FOUND', 'Not found.', 404));
      }

      const tenant = await prisma.tenant.findUnique({
        where: { id: req.user.tenantId },
        select: { featureFlags: true },
      });

      const flags = (tenant?.featureFlags ?? {}) as Record<string, unknown>;
      if (!flags[flag]) {
        return next(new AppError('NOT_FOUND', 'Not found.', 404));
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
