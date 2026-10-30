import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../shared/middleware/error-handler.js';

/**
 * The single gate for everything persona-related: the /dev routes, the seed CLI and the eval
 * harness. Both conditions must hold — a production build never serves it, and a non-production
 * build only serves it when the operator asked for it explicitly.
 */
export function devSeedEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.ENABLE_DEV_SEED === 'true';
}

/** Re-checked on every request, so the mount-time check in main.ts is not the only line. */
export function requireDevSeed(_req: Request, _res: Response, next: NextFunction): void {
  if (!devSeedEnabled()) {
    next(new AppError('NOT_FOUND', 'Not found.', 404));
    return;
  }
  next();
}

/** For the CLIs: exit loudly instead of touching the database. */
export function assertDevSeedEnabled(): void {
  if (!devSeedEnabled()) {
    console.error(
      'Persona seeding is disabled. It needs NODE_ENV != production and ENABLE_DEV_SEED=true ' +
        `(NODE_ENV=${process.env.NODE_ENV ?? 'unset'}, ENABLE_DEV_SEED=${process.env.ENABLE_DEV_SEED ?? 'unset'}).`,
    );
    process.exit(1);
  }
}
