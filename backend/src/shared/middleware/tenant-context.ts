import { AsyncLocalStorage } from 'node:async_hooks';
import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../db.js';

interface TenantStore {
  tenantId: number;
}

export const tenantStorage = new AsyncLocalStorage<TenantStore>();

export async function setTenantContext(req: Request, _res: Response, next: NextFunction): Promise<void> {
  if (req.user?.tenantId) {
    const tenantId = req.user.tenantId;

    // Set PostgreSQL session variable for RLS defense-in-depth (parameterized). Async middleware:
    // Express 4 does not catch a rejected promise, so a database failure goes to next(err).
    try {
      await prisma.$executeRaw(Prisma.sql`SELECT set_config('app.current_tenant_id', ${String(tenantId)}, true)`);
    } catch (err) {
      next(err);
      return;
    }

    // Run the rest of the request inside AsyncLocalStorage context
    tenantStorage.run({ tenantId }, () => next());
    return;
  }

  next();
}
