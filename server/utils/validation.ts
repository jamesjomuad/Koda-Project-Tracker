import { z } from 'zod';
import { PRIORITIES, STATUSES } from '#shared/types/project';
import type { ProjectPayload, ProjectStatus, ProjectPriority, SortField, SortOrder } from '#shared/types/project';
import { SORTABLE_FIELDS } from '#shared/types/project';
import { badRequest } from './errors';
import type { ValidationIssue } from '#shared/types/project';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** True when the string is a real calendar date in YYYY-MM-DD form. */
export function isValidDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

const dateField = (label: string) =>
  z.string().refine(isValidDate, { message: `${label} must be a valid date (YYYY-MM-DD)` });

const projectPayloadSchema = z
  .object({
    clientName: z
      .string({ error: 'Client name is required' })
      .trim()
      .min(1, 'Client name is required')
      .max(120, 'Client name must be 120 characters or fewer'),
    projectName: z
      .string({ error: 'Project name is required' })
      .trim()
      .min(1, 'Project name is required')
      .max(120, 'Project name must be 120 characters or fewer'),
    description: z
      .string()
      .trim()
      .max(2000, 'Description must be 2000 characters or fewer')
      .optional()
      .default(''),
    status: z.enum(STATUSES, { message: `Status must be one of: ${STATUSES.join(', ')}` }),
    priority: z.enum(PRIORITIES, { message: `Priority must be one of: ${PRIORITIES.join(', ')}` }),
    startDate: dateField('Start date'),
    dueDate: dateField('Due date'),
  })
  .refine((p) => p.dueDate >= p.startDate, {
    message: 'Due date cannot be earlier than start date',
    path: ['dueDate'],
  });

export type ValidatedProjectPayload = z.infer<typeof projectPayloadSchema>;

/** Parses a payload (body) for create/update. Non-matching -> 400 + field issues. */
export function parseProjectPayload(body: unknown): ProjectPayload {
  const result = projectPayloadSchema.safeParse(body);
  if (!result.success) {
    const issues: ValidationIssue[] = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || 'body',
      message: issue.message,
    }));
    throw badRequest('Invalid project data', issues);
  }
  return result.data as ProjectPayload;
}

const listQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  sortBy: z.enum(SORTABLE_FIELDS).optional().default('dueDate'),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
});

export interface ParsedListQuery {
  search?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  sortBy: SortField;
  order: SortOrder;
}

export function parseListQuery(query: Record<string, string | undefined>): ParsedListQuery {
  const result = listQuerySchema.safeParse(query);
  if (!result.success) {
    const issues: ValidationIssue[] = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || 'query',
      message: issue.message,
    }));
    throw badRequest('Invalid query parameters', issues);
  }
  return result.data as ParsedListQuery;
}