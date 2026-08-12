import { createError } from 'h3';
import type { H3Error } from 'h3';
import type { ValidationIssue } from '#shared/types/project';

export interface ApiErrorShape {
  code: string;
  message: string;
  issues?: ValidationIssue[];
}

/**
 * Creates a standardized API error with an HTTP status, machine-readable
 * code, human message, and optional field-level validation issues.
 */
export function apiError(
  statusCode: number,
  code: string,
  message: string,
  issues?: ValidationIssue[],
): H3Error {
  return createError({
    statusCode,
    statusMessage: message,
    data: { code, issues },
  });
}

export function badRequest(message: string, issues?: ValidationIssue[]): H3Error {
  return apiError(400, 'VALIDATION_ERROR', message, issues);
}

export function notFound(resource = 'Project'): H3Error {
  return apiError(404, 'NOT_FOUND', `${resource} not found`);
}

export function conflict(message: string): H3Error {
  return apiError(409, 'CONFLICT', message);
}