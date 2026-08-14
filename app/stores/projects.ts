import { defineStore } from 'pinia';
import type { Project, ProjectPayload, ProjectStatus, ProjectPriority, SortField, SortOrder } from '#shared/types/project';
import { STATUSES } from '#shared/types/project';
import { usePersistedRef } from '../composables/usePersistedRef';
import { extractApiError } from '~/utils/api';

export interface ListParams {
  search?: string;
  status?: ProjectStatus | undefined;
  priority?: ProjectPriority | undefined;
  sortBy?: SortField;
  order?: SortOrder;
  workspaceId?: number | undefined;
}

export interface KanbanColumn {
  status: ProjectStatus;
  label: string;
  projects: Project[];
}

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const columnOrder = usePersistedRef<ProjectStatus[]>('kanban-column-order', [...STATUSES], {
    validate: (value) => {
      if (!Array.isArray(value)) return null;
      const valid = value.filter((s) => (STATUSES as readonly string[]).includes(s));
      return valid.length === STATUSES.length ? (valid as ProjectStatus[]) : null;
    },
  });

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
          ...(params.workspaceId ? { workspaceId: params.workspaceId } : {}),
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
  }

  function resetColumnOrder(): void {
    columnOrder.value = [...STATUSES];
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