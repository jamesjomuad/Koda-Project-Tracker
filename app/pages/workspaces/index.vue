<script setup lang="ts">
import { useWorkspacesStore } from '../../stores/workspaces';
import { extractApiError } from '~/utils/api';
import type { Workspace } from '#shared/types/workspace';
import type { WorkspaceListItem } from '../../stores/workspaces';

useSeoMeta({ title: 'Workspaces · Koda Project Tracker' });

const route = useRoute();
const store = useWorkspacesStore();

const workspaces = ref<WorkspaceListItem[]>([]);
const loading = ref(false);
const loadError = ref<string | null>(null);
const showDeleted = ref(false);

async function load(): Promise<void> {
  loading.value = true;
  loadError.value = null;
  try {
    workspaces.value = await $fetch<WorkspaceListItem[]>('/api/workspaces', {
      query: showDeleted.value ? { includeDeleted: 'true' } : {},
    });
  } catch (e) {
    loadError.value = extractApiError(e).message;
  } finally {
    loading.value = false;
  }
}

const modalOpen = ref(false);
const editing = ref<Workspace | null>(null);

function openCreate(): void {
  editing.value = null;
  modalOpen.value = true;
}

function openEdit(workspace: Workspace): void {
  editing.value = { ...workspace };
  modalOpen.value = true;
}

function closeModal(): void {
  modalOpen.value = false;
  editing.value = null;
}

function onSubmitted(): void {
  closeModal();
  load();
}

const deleteTarget = ref<Workspace | null>(null);
const deleteBusy = ref(false);
const deleteError = ref<string | null>(null);

function requestDelete(workspace: Workspace): void {
  deleteTarget.value = workspace;
  deleteError.value = null;
}

async function confirmDelete(): Promise<void> {
  if (!deleteTarget.value) return;
  deleteBusy.value = true;
  deleteError.value = null;
  try {
    await store.softDeleteWorkspace(deleteTarget.value.id);
    deleteTarget.value = null;
    await load();
  } catch (e) {
    deleteError.value = extractApiError(e).message;
  } finally {
    deleteBusy.value = false;
  }
}

const restoreBusy = ref<number | null>(null);

async function restore(workspace: Workspace): Promise<void> {
  restoreBusy.value = workspace.id;
  try {
    await store.restoreWorkspace(workspace.id);
    await load();
  } catch (e) {
    loadError.value = extractApiError(e).message;
  } finally {
    restoreBusy.value = null;
  }
}

watch(showDeleted, load);

onMounted(() => {
  load();
  if (store.workspaces.length === 0) store.fetchWorkspaces();
  if (route.query.new) openCreate();
});
</script>

<template>
  <section>
    <header class="page-head">
      <div>
        <h1>Workspaces</h1>
        <p class="subtitle">Organize client projects into workspaces.</p>
      </div>
      <UButton icon="i-lucide-plus" color="primary" @click="openCreate">New Workspace</UButton>
    </header>

    <UAlert
      v-if="loadError"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      :title="loadError"
      class="mb-4"
      role="alert"
    />

    <div class="meta-row">
      <span>
        {{ loading ? 'Loading…' : `${workspaces.length} workspace${workspaces.length === 1 ? '' : 's'}` }}
      </span>
      <UCheckbox
        v-model="showDeleted"
        label="Show deleted"
        name="showDeleted"
      />
    </div>

    <UAlert
      v-if="loading && workspaces.length === 0"
      color="info"
      variant="soft"
      icon="i-lucide-loader-circle"
      title="Loading workspaces…"
      class="mb-4"
      role="status"
    />

    <UEmpty
      v-else-if="!loading && workspaces.length === 0"
      icon="i-lucide-folder-open"
      class="mb-4"
    >
      <template #title>
        <h3>No workspaces found</h3>
      </template>
      <template #description>
        <p>Create a workspace to start organizing projects.</p>
      </template>
      <template #actions>
        <UButton icon="i-lucide-plus" color="primary" @click="openCreate">New Workspace</UButton>
      </template>
    </UEmpty>

    <ul v-else class="workspace-list" :class="{ 'is-refreshing': loading }">
      <li v-for="workspace in workspaces" :key="workspace.id">
        <UCard class="workspace-card" :class="{ 'is-deleted': workspace.deletedAt }">
          <div class="card-top">
            <div>
              <h3 class="workspace-name">
                <NuxtLink
                  v-if="!workspace.deletedAt"
                  :to="`/${workspace.slug}/projects`"
                  class="workspace-link"
                >
                  {{ workspace.name }}
                </NuxtLink>
                <template v-else>{{ workspace.name }}</template>
                <UBadge v-if="workspace.deletedAt" color="error" variant="subtle" size="sm">
                  Deleted
                </UBadge>
              </h3>
              <p v-if="workspace.description" class="description">{{ workspace.description }}</p>
            </div>
            <div class="card-actions">
              <template v-if="workspace.deletedAt">
                <UButton
                  color="primary"
                  variant="outline"
                  size="xs"
                  icon="i-lucide-rotate-ccw"
                  :loading="restoreBusy === workspace.id"
                  @click="restore(workspace)"
                >
                  Restore
                </UButton>
              </template>
              <template v-else>
                <UButton
                  color="neutral"
                  variant="outline"
                  size="xs"
                  icon="i-lucide-pencil"
                  @click="openEdit(workspace)"
                >
                  Edit
                </UButton>
                <UButton
                  color="error"
                  variant="outline"
                  size="xs"
                  icon="i-lucide-trash-2"
                  @click="requestDelete(workspace)"
                >
                  Delete
                </UButton>
              </template>
            </div>
          </div>
          <div class="card-meta">
            <span class="project-count">
              {{ workspace.projectCount ?? 0 }} project{{ (workspace.projectCount ?? 0) === 1 ? '' : 's' }}
            </span>
          </div>
        </UCard>
      </li>
    </ul>

    <UModal v-model:open="modalOpen" :title="editing ? 'Edit Workspace' : 'New Workspace'" :dismissible="true">
      <template #body>
        <WorkspaceForm
          :mode="editing ? 'edit' : 'create'"
          :initial="editing"
          @submitted="onSubmitted"
          @cancel="closeModal"
        />
      </template>
    </UModal>

    <ConfirmDialog
      :open="!!deleteTarget"
      title="Delete workspace?"
      :message="`Delete “${deleteTarget?.name}”? Its projects will be hidden from view. You can restore it later from the deleted list.`"
      :busy="deleteBusy"
      @cancel="deleteTarget = null"
      @confirm="confirmDelete"
    />
  </section>
</template>

<style scoped>
.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.page-head h1 {
  margin: 0;
  font-size: 1.6rem;
}

.subtitle {
  margin: 0.25rem 0 0;
  color: var(--color-text-muted);
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.9rem;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.workspace-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
  transition: opacity 0.15s ease;
}

.workspace-list.is-refreshing {
  opacity: 0.5;
}

.workspace-card {
  height: 100%;
  transition: box-shadow 0.15s ease;
}

.workspace-card:hover {
  box-shadow: var(--shadow-md);
}

.workspace-card.is-deleted {
  opacity: 0.7;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
}

.workspace-name {
  margin: 0;
  font-size: 1.05rem;
}

.workspace-link {
  color: var(--color-text);
}

.workspace-link:hover {
  color: var(--color-primary);
  text-decoration: none;
}

.description {
  margin: 0.25rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.card-actions {
  display: flex;
  gap: 0.4rem;
  flex-shrink: 0;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: 0.75rem;
}

.project-count {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-weight: 600;
}
</style>