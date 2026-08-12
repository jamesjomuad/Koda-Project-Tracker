import type { H3Error, H3Event } from 'h3';
import { send, setResponseStatus } from 'h3';
import type { ValidationIssue } from '#shared/types/project';

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    issues?: ValidationIssue[];
  };
}

/**
 * Global error handler. Registered via nuxt.config `nitro.errorHandler`.
 * Only overrides responses for /api/* requests; page errors are delegated
 * back to Nuxt's default handler so error.vue still renders normally.
 */
export default function handleError(error: H3Error, event: H3Event): void {
  if (!event.path.startsWith('/api/')) {
    return; // let the default handler deal with page-level errors
  }

  const statusCode = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;
  const data = error.data as { code?: string; issues?: ValidationIssue[] } | undefined;

  if (statusCode >= 500) {
    console.error('[api error]', error.statusMessage || error.message);
  }

  const body: ApiErrorBody = {
    error: {
      code: statusCode >= 500 ? 'INTERNAL_ERROR' : (data?.code ?? 'ERROR'),
      message:
        statusCode >= 500
          ? 'Internal server error'
          : error.statusMessage || error.message || 'Something went wrong',
    },
  };

  if (data?.issues?.length) {
    body.error.issues = data.issues;
  }

  setResponseStatus(event, statusCode);
  void send(event, JSON.stringify(body));
}