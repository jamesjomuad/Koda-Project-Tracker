import type { Project, ProjectPayload, ProjectStatus, ProjectPriority, SortField, SortOrder } from '#shared/types/project';
import { STATUSES, PRIORITIES } from '#shared/types/project';

export interface ListParams {
  search?: string;
  status?: ProjectStatus | '';
  priority?: ProjectPriority | '';
  sortBy?: SortField;
  order?: SortOrder;
}

export interface ApiErrorShape {
  code: string;
  message: string;
  issues?: { field: string; message: string }[];
}

/** Normalizes a thrown fetch error into a displayable shape. */
export function extractApiError(error: unknown): { message: string; issues: Record<string, string> } {
  const data = (error as { data?: { error?: ApiErrorShape } })?.data?.error;
  if (!data) return { message: 'Something went wrong. Please try again.', issues: {} };

  const issues: Record<string, string> = {};
  for (const issue of data.issues ?? []) {
    if (!issues[issue.field]) issues[issue.field] = issue.message;
  }
  return { message: data.message, issues };
}

export function useProjects() {
  const projects = ref<Project[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchProjects(params: ListParams = {}): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      projects.value = await $fetch<Project[]>('/api/projects', {
        query: {
          ...(params.search ? { search: params.search } : {}),
          ...(params.status ? { status: params.status } : {}),
          ...(params.priority ? { priority: params.priority } : {}),
          ...(params.sortBy ? { sortBy: params.sortBy } : {}),
          ...(params.order ? { order: params.order } : {}),
        },
      });
    } catch (e) {
      error.value = extractApiError(e).message;
    } finally {
      loading.value = false;
    }
  }

  async function createProject(payload: ProjectPayload): Promise<Project> {
    return $fetch<Project>('/api/projects', { method: 'POST', body: payload });
  }

  async function updateProject(id: number, payload: ProjectPayload): Promise<Project> {
    return $fetch<Project>(`/api/projects/${id}`, { method: 'PUT', body: payload });
  }

  async function deleteProject(id: number): Promise<void> {
    await $fetch(`/api/projects/${id}`, { method: 'DELETE' });
  }

  return { projects, loading, error, fetchProjects, createProject, updateProject, deleteProject };
}

export { STATUSES, PRIORITIES };
export type { Project, ProjectPayload, ProjectStatus, ProjectPriority, SortField, SortOrder };