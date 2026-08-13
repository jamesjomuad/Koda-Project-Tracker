import { defineStore } from 'pinia';
import type { Project, ProjectPayload, ProjectStatus, ProjectPriority, SortField, SortOrder } from '#shared/types/project';
import { STATUSES } from '#shared/types/project';

export interface ListParams {
  search?: string;
  status?: ProjectStatus | undefined;
  priority?: ProjectPriority | undefined;
  sortBy?: SortField;
  order?: SortOrder;
}

export interface KanbanColumn {
  status: ProjectStatus;
  label: string;
  projects: Project[];
}

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

const COLUMN_ORDER_KEY = 'kanban-column-order';

function loadColumnOrder(): ProjectStatus[] {
  if (import.meta.client) {
    try {
      const raw = localStorage.getItem(COLUMN_ORDER_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ProjectStatus[];
        const valid = parsed.filter((s) => (STATUSES as readonly string[]).includes(s));
        if (valid.length === STATUSES.length) return valid as ProjectStatus[];
      }
    } catch { /* ignore */ }
  }
  return [...STATUSES];
}

function saveColumnOrder(order: ProjectStatus[]): void {
  if (import.meta.client) {
    localStorage.setItem(COLUMN_ORDER_KEY, JSON.stringify(order));
  }
}

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const columnOrder = ref<ProjectStatus[]>(loadColumnOrder());

  const columns = computed<KanbanColumn[]>(() =>
    columnOrder.value.map((status) => ({
      status,
      label: status,
      projects: projects.value
        .filter((p) => p.status === status)
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    })),
  );

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

  async function moveCard(project: Project, toStatus: ProjectStatus): Promise<void> {
    if (project.status === toStatus) return;

    const previousStatus = project.status;
    const previousProjects = [...projects.value];

    // Optimistic update
    projects.value = projects.value.map((p) =>
      p.id === project.id ? { ...p, status: toStatus } : p,
    );

    try {
      await $fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        body: { ...project, status: toStatus },
      });
    } catch {
      // Rollback on failure
      projects.value = previousProjects;
    }
  }

  function reorderColumns(newOrder: KanbanColumn[]): void {
    columnOrder.value = newOrder.map((c) => c.status);
    saveColumnOrder(columnOrder.value);
  }

  function resetColumnOrder(): void {
    columnOrder.value = [...STATUSES];
    saveColumnOrder(columnOrder.value);
  }

  return {
    projects,
    loading,
    error,
    columns,
    columnOrder,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    moveCard,
    reorderColumns,
    resetColumnOrder,
  };
});

export { STATUSES, PRIORITIES } from '#shared/types/project';
export type { Project, ProjectPayload, ProjectStatus, ProjectPriority, SortField, SortOrder } from '#shared/types/project';
