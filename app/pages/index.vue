<script setup lang="ts">
import { STATUSES, PRIORITIES, useProjects, extractApiError } from '../composables/useProjects';
import type { Project, SortField, SortOrder } from '#shared/types/project';

useSeoMeta({ title: 'Projects · Koda Project Tracker' });

const { projects, loading, error, fetchProjects, deleteProject } = useProjects();

const search = ref('');
const statusFilter = ref<'' | Project['status']>('');
const priorityFilter = ref<'' | Project['priority']>('');
const sortBy = ref<SortField>('dueDate');
const sortOrder = ref<SortOrder>('asc');

let searchTimer: ReturnType<typeof setTimeout> | undefined;

watch([search, statusFilter, priorityFilter, sortBy, sortOrder], () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(load, 250);
}, { deep: true });

async function load(): Promise<void> {
  await fetchProjects({
    search: search.value,
    status: statusFilter.value,
    priority: priorityFilter.value,
    sortBy: sortBy.value,
    order: sortOrder.value,
  });
}

function toggleSort(field: SortField): void {
  if (sortBy.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortBy.value = field;
    sortOrder.value = 'asc';
  }
}

function sortArrow(field: SortField): string {
  if (sortBy.value !== field) return '';
  return sortOrder.value === 'asc' ? '↑' : '↓';
}

const deleteTarget = ref<Project | null>(null);
const deleteBusy = ref(false);
const deleteError = ref<string | null>(null);

async function confirmDelete(): Promise<void> {
  if (!deleteTarget.value) return;
  deleteBusy.value = true;
  deleteError.value = null;
  try {
    await deleteProject(deleteTarget.value.id);
    deleteTarget.value = null;
    await load();
  } catch (e) {
    deleteError.value = extractApiError(e).message;
  } finally {
    deleteBusy.value = false;
  }
}

onMounted(load);
</script>

<template>
  <section>
    <header class="page-head">
      <div>
        <h1>Projects</h1>
        <p class="subtitle">Track client projects, progress, and priorities.</p>
      </div>
    </header>

    <div class="toolbar">
      <input
        v-model="search"
        class="input search"
        type="search"
        placeholder="Search client or project…"
        aria-label="Search projects"
      />
      <select v-model="statusFilter" class="select" aria-label="Filter by status">
        <option value="">All statuses</option>
        <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
      </select>
      <select v-model="priorityFilter" class="select" aria-label="Filter by priority">
        <option value="">All priorities</option>
        <option v-for="p in PRIORITIES" :key="p" :value="p">{{ p }}</option>
      </select>
      <select v-model="sortBy" class="select" aria-label="Sort projects">
        <option value="dueDate">Sort by due date</option>
        <option value="startDate">Sort by start date</option>
        <option value="priority">Sort by priority</option>
        <option value="status">Sort by status</option>
        <option value="clientName">Sort by client</option>
        <option value="projectName">Sort by project</option>
        <option value="createdAt">Sort by created</option>
      </select>
      <button
        class="btn btn-secondary sort-order"
        :aria-label="`Sort ${sortOrder === 'asc' ? 'ascending' : 'descending'}`"
        @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'"
      >
        {{ sortOrder === 'asc' ? '↑ Asc' : '↓ Desc' }}
      </button>
    </div>

    <p v-if="error" class="alert alert-error" role="alert">{{ error }}</p>

    <div v-if="loading && projects.length === 0" class="empty-state" role="status">Loading projects…</div>

    <div v-else-if="!loading && projects.length === 0" class="empty-state">
      <h3>No projects found</h3>
      <p>Try adjusting your search or filters, or create a new project.</p>
      <NuxtLink class="btn btn-primary" to="/projects/new">+ New Project</NuxtLink>
    </div>

    <ul v-else class="project-list">
      <li v-for="project in projects" :key="project.id" class="project-card">
        <div class="card-top">
          <div>
            <h3 class="project-name">
              <NuxtLink :to="`/projects/${project.id}/edit`">{{ project.projectName }}</NuxtLink>
            </h3>
            <p class="client-name">{{ project.clientName }}</p>
          </div>
          <div class="card-actions">
            <NuxtLink class="btn btn-secondary btn-sm" :to="`/projects/${project.id}/edit`">Edit</NuxtLink>
            <button class="btn btn-danger btn-sm" @click="deleteTarget = project">Delete</button>
          </div>
        </div>

        <p v-if="project.description" class="description">{{ project.description }}</p>

        <div class="card-meta">
          <ProjectStatusBadge :status="project.status" />
          <ProjectPriorityBadge :priority="project.priority" />
          <span class="date" :class="{ overdue: project.dueDate < new Date().toISOString().slice(0, 10) && project.status !== 'Completed' }">
            Due {{ project.dueDate }}
          </span>
        </div>
      </li>
    </ul>
  </section>

  <ConfirmDialog
    :open="!!deleteTarget"
    title="Delete project?"
    :message="`Delete “${deleteTarget?.projectName}” for ${deleteTarget?.clientName}? This action cannot be undone.`"
    :busy="deleteBusy"
    @cancel="deleteTarget = null"
    @confirm="confirmDelete"
  />
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

.toolbar {
  display: grid;
  grid-template-columns: minmax(220px, 1.6fr) repeat(3, minmax(130px, 1fr)) auto;
  gap: 0.6rem;
  margin-bottom: 1.25rem;
}

.search {
  width: 100%;
}

.sort-order {
  white-space: nowrap;
}

.project-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
}

.project-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 1.1rem 1.25rem;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: box-shadow 0.15s ease;
}

.project-card:hover {
  box-shadow: var(--shadow-md);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
}

.project-name {
  margin: 0;
  font-size: 1.05rem;
}

.project-name a {
  color: var(--color-text);
}

.project-name a:hover {
  color: var(--color-primary);
  text-decoration: none;
}

.client-name {
  margin: 0.15rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.card-actions {
  display: flex;
  gap: 0.4rem;
  flex-shrink: 0;
}

.btn-sm {
  padding: 0.3rem 0.65rem;
  font-size: 0.8rem;
}

.description {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: auto;
}

.date {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-left: auto;
}

.date.overdue {
  color: var(--color-danger);
  font-weight: 600;
}

@media (max-width: 900px) {
  .toolbar {
    grid-template-columns: 1fr 1fr;
  }

  .search {
    grid-column: 1 / -1;
  }
}
</style>