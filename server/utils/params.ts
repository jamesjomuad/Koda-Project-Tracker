import { badRequest } from './errors';

/** Coerces a route id param into a positive integer or throws a 400. */
export function parseIdParam(raw: string | undefined): number {
  if (raw === undefined || raw === '') throw badRequest('Invalid project id');
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw badRequest('Invalid project id');
  return id;
}

/** Flattens getQuery() values (which can be arrays) into strings for zod. */
export function coerceQuery(query: Record<string, unknown>): Record<string, string | undefined> {
  return Object.fromEntries(
    Object.entries(query).map(([key, value]) => [key, Array.isArray(value) ? undefined : String(value)]),
  );
}