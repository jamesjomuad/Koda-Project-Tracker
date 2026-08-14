import { defineStore } from 'pinia';
import type { Workspace, WorkspacePayload } from '#shared/types/workspace';
import { usePersistedRef } from '../composables/usePersistedRef';
import { extractApiError } from '~/utils/api';

export interface WorkspaceListItem extends Workspace {
  projectCount: number;
}

export const useWorkspacesStore = defineStore('workspaces', () => {
  const workspaces = ref<WorkspaceListItem[]>([]);
  const activeWorkspaceId = usePersistedRef<number | null>('active-workspace-id', null, {
    validate: (value) =>
      typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null,
  });

  async function fetchWorkspaces(): Promise<void> {
    try {
      workspaces.value = await $fetch<WorkspaceListItem[]>('/api/workspaces');
    } catch (e) {
      console.error('Failed to fetch workspaces:', extractApiError(e).message);
    }
  }

  async function createWorkspace(payload: WorkspacePayload): Promise<Workspace> {
    const workspace = await $fetch<Workspace>('/api/workspaces', { method: 'POST', body: payload });
    await fetchWorkspaces();
    return workspace;
  }

  async function updateWorkspace(id: number, payload: WorkspacePayload): Promise<Workspace> {
    const workspace = await $fetch<Workspace>(`/api/workspaces/${id}`, { method: 'PUT', body: payload });
    await fetchWorkspaces();
    return workspace;
  }

  async function softDeleteWorkspace(id: number): Promise<void> {
    await $fetch(`/api/workspaces/${id}`, { method: 'DELETE' });
    if (activeWorkspaceId.value === id) setActiveWorkspace(null);
    await fetchWorkspaces();
  }

  async function restoreWorkspace(id: number): Promise<void> {
    await $fetch(`/api/workspaces/${id}/restore`, { method: 'POST' });
    await fetchWorkspaces();
  }

  function setActiveWorkspace(id: number | null): void {
    activeWorkspaceId.value = id;
  }

  return {
    workspaces,
    activeWorkspaceId,
    fetchWorkspaces,
    createWorkspace,
    updateWorkspace,
    softDeleteWorkspace,
    restoreWorkspace,
    setActiveWorkspace,
  };
});