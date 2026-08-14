export interface ApiErrorShape {
  code: string;
  message: string;
  issues?: { field: string; message: string }[];
}

export function extractApiError(error: unknown): { message: string; issues: Record<string, string> } {
  const data = (error as { data?: { error?: ApiErrorShape } })?.data?.error;
  if (!data) return { message: 'Something went wrong. Please try again.', issues: {} };

  const issues: Record<string, string> = {};
  for (const issue of data.issues ?? []) {
    if (!issues[issue.field]) issues[issue.field] = issue.message;
  }
  return { message: data.message, issues };
}