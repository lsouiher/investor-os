import type { Request, Response, NextFunction } from 'express';

/**
 * The API contract (contracts/api-v1.md) specifies snake_case keys in every JSON response,
 * and the frontend is written against it. Most v1 service modules build camelCase objects,
 * so this middleware normalizes the response shape in one place instead of per-module.
 *
 * Only plain objects and arrays are walked — Dates, Buffers and other class instances are
 * left untouched so JSON serialization is unaffected.
 */
export function toSnakeCase(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function snakeCaseKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(snakeCaseKeys);
  if (!isPlainObject(value)) return value;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    out[toSnakeCase(k)] = snakeCaseKeys(v);
  }
  return out;
}

export function snakeCaseResponse(_req: Request, res: Response, next: NextFunction): void {
  const originalJson = res.json.bind(res);
  res.json = ((body: unknown) => originalJson(snakeCaseKeys(body))) as Response['json'];
  next();
}
