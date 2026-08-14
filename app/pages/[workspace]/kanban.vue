<script setup lang="ts">
import { useProjectsStore } from '../../stores/projects';
import { useWorkspacesStore } from '../../stores/workspaces';
import { useUsersStore } from '../../stores/users';
import { extractApiError } from '~/utils/api';
import type { Project, ProjectStatus } from '#shared/types/project';
import type { WorkspaceListItem } from '../../stores/workspaces';

const route = useRoute();
const store = useProjectsStore();
const workspacesStore = useWorkspacesStore();
const usersStore = useUsersStore();

const slug = computed(() => String(route.params.workspace ?? ''));
const workspace = ref<WorkspaceListItem | null>(null);
const notFound = ref(false);

useSeoMeta({
  title: () => (workspace.value ? `${workspace.value.name} · Board · Koda` : 'Board · Koda'),
});

const editModalOpen = ref(false);
const editingProject = ref<Project | null>(null);

const userItems = computed(() => [
  { label: 'Unassigned', value: null },
  ...usersStore.users.map((u) => ({ label: u.name, value: u.id })),
]);

const workspaceItems = computed(() => [
  ...workspacesStore.workspaces.map((w) => ({ label: w.name, value: w.id })),
]);

const deleteTarget = ref<Project | null>(null);
const deleteBusy = ref(false);
const deleteError = ref<string | null>(null);

async function resolveWorkspace(): Promise<void> {
  notFound.value = false;
  workspace.value = null;
  if (workspacesStore.workspaces.length === 0) await workspacesStore.fetchWorkspaces();
  const found = workspacesStore.workspaces.find((w) => w.slug === slug.value);
  if (!found) {
    notFound.value = true;
    return;
  }
  workspace.value = found;
  if (workspacesStore.activeWorkspaceId !== found.id) workspacesStore.setActiveWorkspace(found.id);
  await store.fetchProjects({ workspaceId: found.id });
}

watch(() => route.params.workspace, () => {
  resolveWorkspace();
});

onMounted(() => {
  resolveWorkspace();
  usersStore.fetchUsers();
});

async function handleMove(project: Project, toStatus: ProjectStatus): Promise<void> {
  await store.moveCard(project, toStatus);
}

async function handleAdd(status: ProjectStatus, name: string): Promise<void> {
  const workspaceId = workspace.value?.id ?? workspacesStore.activeWorkspaceId;
  if (!workspaceId) {
    console.error('Cannot add project: no workspace available');
    return;
  }
  try {
    const today = new Date().toISOString().split('T')[0]!;
    await store.createProject({
      clientName: 'New Client',
      projectName: name,
      status,
      priority: 'Medium',
      startDate: today,
      dueDate: today,
      workspaceId,
    });
    await store.fetchProjects({ workspaceId });
  } catch (e) {
    const err = extractApiError(e);
    console.error('Failed to create project:', err.message);
  }
}

function handleEdit(project: Project): void {
  editingProject.value = { ...project };
  editModalOpen.value = true;
}

async function saveEdit(): Promise<void> {
  if (!editingProject.value) return;
  try {
    await store.updateProject(editingProject.value.id, {
      clientName: editingProject.value.clientName,
      projectName: editingProject.value.projectName,
      description: editingProject.value.description,
      status: editingProject.value.status,
      priority: editingProject.value.priority,
      startDate: editingProject.value.startDate,
      dueDate: editingProject.value.dueDate,
      assignedTo: editingProject.value.assignedTo,
      workspaceId: editingProject.value.workspaceId,
    });
    editModalOpen.value = false;
    editingProject.value = null;
    await store.fetchProjects({ workspaceId: workspace.value?.id ?? undefined });
  } catch (e) {
    const err = extractApiError(e);
    console.error('Failed to update project:', err.message);
  }
}

function handleDelete(project: Project): void {
  deleteTarget.value = project;
}

async function confirmDelete(): Promise<void> {
  if (!deleteTarget.value) return;
  deleteBusy.value = true;
  deleteError.value = null;
  try {
    await store.deleteProject(deleteTarget.value.id);
    deleteTarget.value = null;
    await store.fetchProjects({ workspaceId: workspace.value?.id ?? undefined });
  } catch (e) {
    deleteError.value = extractApiError(e).message;
  } finally {
    deleteBusy.value = false;
  }
}
</script>

<template>
  <section>
    <UEmpty
      v-if="notFound"
      icon="i-lucide-folder-question"
    >
      <template #title>
        <h3>Workspace not found</h3>
      </template>
      <template #description>
        <p>The workspace “{{ slug }}” may have been deleted, or the link is wrong.</p>
      </template>
      <template #actions>
        <UButton to="/" color="primary" icon="i-lucide-arrow-left">Back to workspaces</UButton>
      </template>
    </UEmpty>

    <template v-else-if="workspace">
      <header class="page-head">
        <div>
          <h1>{{ workspace.name }}</h1>
          <p class="subtitle">Board · drag cards between statuses.</p>
        </div>
        <WorkspaceNav :slug="workspace.slug" />
      </header>

      <UAlert
        v-if="store.error"
        color="error"
        variant="soft"
        icon="i-lucide-circle-alert"
        :title="store.error"
        class="mb-4"
        role="alert"
      />

      <KanbanBoard
        :columns="store.columns"
        :users="usersStore.users"
        @reorder-columns="store.reorderColumns"
        @move="handleMove"
        @add="handleAdd"
        @edit="handleEdit"
        @delete="handleDelete"
      />

      <UModal
        v-model:open="editModalOpen"
        title="Edit Project"
        :dismissible="true"
      >
        <template v-if="editingProject" #body>
          <div class="edit-form">
            <div class="form-field">
              <label class="form-label">Project Name</label>
              <UInput v-model="editingProject.projectName" placeholder="Project name" />
            </div>
            <div class="form-field">
              <label class="form-label">Client Name</label>
              <UInput v-model="editingProject.clientName" placeholder="Client name" />
            </div>
            <div class="form-field">
              <label class="form-label">Description</label>
              <UTextarea v-model="editingProject.description" placeholder="Optional description" :rows="3" />
            </div>
            <div class="form-row">
              <div class="form-field">
                <label class="form-label">Status</label>
                <USelect
                  v-model="editingProject.status"
                  :items="[
                    { label: 'Planning', value: 'Planning' },
                    { label: 'In Progress', value: 'In Progress' },
                    { label: 'On Hold', value: 'On Hold' },
                    { label: 'Completed', value: 'Completed' },
                  ]"
                  value-key="value"
                />
              </div>
              <div class="form-field">
                <label class="form-label">Priority</label>
                <USelect
                  v-model="editingProject.priority"
                  :items="[
                    { label: 'Low', value: 'Low' },
                    { label: 'Medium', value: 'Medium' },
                    { label: 'High', value: 'High' },
                  ]"
                  value-key="value"
                />
              </div>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label class="form-label">Start Date</label>
                <UInput v-model="editingProject.startDate" type="date" />
              </div>
              <div class="form-field">
                <label class="form-label">Due Date</label>
                <UInput v-model="editingProject.dueDate" type="date" />
              </div>
            </div>
            <div class="form-field">
              <label class="form-label">Assigned To</label>
              <USelect
                v-model="editingProject.assignedTo"
                :items="userItems"
                value-key="value"
              />
            </div>
            <div class="form-field">
              <label class="form-label">Workspace</label>
              <USelect
                v-model="editingProject.workspaceId"
                :items="workspaceItems"
                value-key="value"
              />
            </div>
          </div>
        </template>
        <template #footer>
          <UButton color="neutral" variant="outline" @click="editModalOpen = false">Cancel</UButton>
          <UButton color="primary" @click="saveEdit">Save Changes</UButton>
        </template>
      </UModal>

      <ConfirmDialog
        :open="!!deleteTarget"
        title="Delete project?"
        :message="`Delete \u201c${deleteTarget?.projectName}\u201d for ${deleteTarget?.clientName}? This action cannot be undone.`"
        :busy="deleteBusy"
        @cancel="deleteTarget = null"
        @confirm="confirmDelete"
      />
    </template>
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

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
</style>