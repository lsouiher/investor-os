// Tenant scoping is applied via the tenant-context middleware which:
// 1. Sets AsyncLocalStorage store for application-level filtering
// 2. Sets PostgreSQL session variable for RLS defense-in-depth
//
// Prisma v6 removed $use middleware. Tenant filtering is enforced by:
// - Including tenantId in all repository queries explicitly
// - RLS policies at the database level as defense-in-depth
//
// Repository pattern: every query on tenant-scoped tables MUST include tenantId in the where clause.

import { tenantStorage } from './tenant-context.js';

export function getCurrentTenantId(): number | undefined {
  return tenantStorage.getStore()?.tenantId;
}

export function requireTenantId(): number {
  const tenantId = getCurrentTenantId();
  if (!tenantId) {
    throw new Error('Tenant context not set. Ensure authentication middleware ran.');
  }
  return tenantId;
}
