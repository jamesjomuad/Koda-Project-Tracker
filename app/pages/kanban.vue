<script setup lang="ts">
import { useProjectsStore, extractApiError } from '../stores/projects';
import type { Project, ProjectStatus } from '#shared/types/project';

useSeoMeta({ title: 'Board · Koda Project Tracker' });

const store = useProjectsStore();

const editModalOpen = ref(false);
const editingProject = ref<Project | null>(null);

const deleteTarget = ref<Project | null>(null);
const deleteBusy = ref(false);
const deleteError = ref<string | null>(null);

async function handleMove(project: Project, toStatus: ProjectStatus): Promise<void> {
  await store.moveCard(project, toStatus);
}

async function handleAdd(status: ProjectStatus, name: string): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0]!;
    await store.createProject({
      clientName: 'New Client',
      projectName: name,
      status,
      priority: 'Medium',
      startDate: today,
      dueDate: today,
    });
    await store.fetchProjects();
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
    });
    editModalOpen.value = false;
    editingProject.value = null;
    await store.fetchProjects();
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
    await store.fetchProjects();
  } catch (e) {
    deleteError.value = extractApiError(e).message;
  } finally {
    deleteBusy.value = false;
  }
}

onMounted(() => store.fetchProjects());
</script>

<template>
  <section>
    <header class="page-head">
      <div>
        <h1>Kanban Board</h1>
        <p class="subtitle">Drag projects between columns to update their status.</p>
      </div>
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
  </section>
</template>

<style scoped>
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
