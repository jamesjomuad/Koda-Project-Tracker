<script setup lang="ts">
import { STATUSES, PRIORITIES, useProjectsStore, extractApiError } from '../stores/projects';
import type { Project, SortField, SortOrder } from '#shared/types/project';

useSeoMeta({ title: 'Projects · Koda Project Tracker' });

const store = useProjectsStore();

const search = ref('');
const statusFilter = ref<Project['status'] | undefined>(undefined);
const priorityFilter = ref<Project['priority'] | undefined>(undefined);
const sortBy = ref<SortField>('dueDate');
const sortOrder = ref<SortOrder>('asc');

let searchTimer: ReturnType<typeof setTimeout> | undefined;

watch([search, statusFilter, priorityFilter, sortBy, sortOrder], () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(load, 250);
}, { deep: true });

watch(() => store.activeWorkspaceId, () => {
  clearTimeout(searchTimer);
  load();
});

async function load(): Promise<void> {
  await store.fetchProjects({
    search: search.value,
    status: statusFilter.value,
    priority: priorityFilter.value,
    sortBy: sortBy.value,
    order: sortOrder.value,
    workspaceId: store.activeWorkspaceId ?? undefined,
  });
}

const activeWorkspace = computed(() =>
  store.workspaces.find((w) => w.id === store.activeWorkspaceId),
);

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

/** Whole days from local midnight today to the given YYYY-MM-DD date (negative = past). */
function dayDiff(dateStr: string): number {
  const [y = 0, m = 0, d = 0] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d).getTime();
  const now = new Date();
  const midnightToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((target - midnightToday) / 86_400_000);
}

function formatDate(dateStr: string): string {
  const [y = 0, m = 0, d = 0] = dateStr.split('-').map(Number);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  if (y !== new Date().getFullYear()) opts.year = 'numeric';
  return new Date(y, m - 1, d).toLocaleDateString('en-US', opts);
}

function dueInfo(project: Project): { label: string; kind: 'normal' | 'soon' | 'overdue' } {
  if (project.status === 'Completed') {
    return { label: `Done · ${formatDate(project.dueDate)}`, kind: 'normal' };
  }
  const diff = dayDiff(project.dueDate);
  if (diff < 0) return { label: `Overdue by ${Math.abs(diff)}d`, kind: 'overdue' };
  if (diff === 0) return { label: 'Due today', kind: 'soon' };
  if (diff <= 7) return { label: `Due in ${diff}d`, kind: 'soon' };
  return { label: `Due ${formatDate(project.dueDate)}`, kind: 'normal' };
}

const stats = computed(() => ({
  total: store.projects.length,
  inProgress: store.projects.filter((p) => p.status === 'In Progress').length,
  completed: store.projects.filter((p) => p.status === 'Completed').length,
  overdue: store.projects.filter((p) => p.status !== 'Completed' && dayDiff(p.dueDate) < 0).length,
}));

const filtersActive = computed(
  () => !!search.value || !!statusFilter.value || !!priorityFilter.value,
);

function clearFilters(): void {
  search.value = '';
  statusFilter.value = undefined;
  priorityFilter.value = undefined;
}

const deleteTarget = ref<Project | null>(null);
const deleteBusy = ref(false);
const deleteError = ref<string | null>(null);

async function confirmDelete(): Promise<void> {
  if (!deleteTarget.value) return;
  deleteBusy.value = true;
  deleteError.value = null;
  try {
    await store.deleteProject(deleteTarget.value.id);
    deleteTarget.value = null;
    await load();
  } catch (e) {
    deleteError.value = extractApiError(e).message;
  } finally {
    deleteBusy.value = false;
  }
}

onMounted(() => {
  if (store.workspaces.length === 0) store.fetchWorkspaces();
  load();
});
</script>

<template>
  <section>
    <header class="page-head">
      <div>
        <h1>Projects</h1>
        <p class="subtitle">
          {{ activeWorkspace ? `Projects in “${activeWorkspace.name}”.` : 'Track client projects, progress, and priorities.' }}
        </p>
      </div>
    </header>

    <div class="stats" aria-label="Project summary">
      <div class="stat">
        <span class="stat-icon stat-icon-total" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="7" width="18" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        </span>
        <span class="stat-text">
          <span class="stat-value">{{ stats.total }}</span>
          <span class="stat-label">Projects</span>
        </span>
      </div>
      <div class="stat">
        <span class="stat-icon stat-icon-progress" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </span>
        <span class="stat-text">
          <span class="stat-value">{{ stats.inProgress }}</span>
          <span class="stat-label">In progress</span>
        </span>
      </div>
      <div class="stat">
        <span class="stat-icon stat-icon-completed" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </span>
        <span class="stat-text">
          <span class="stat-value">{{ stats.completed }}</span>
          <span class="stat-label">Completed</span>
        </span>
      </div>
      <div class="stat stat-overdue" :class="{ 'has-value': stats.overdue > 0 }">
        <span class="stat-icon stat-icon-overdue" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </span>
        <span class="stat-text">
          <span class="stat-value">{{ stats.overdue }}</span>
          <span class="stat-label">Overdue</span>
        </span>
      </div>
    </div>

    <div class="toolbar">
      <UInput
        v-model="search"
        class="search"
        type="search"
        icon="i-lucide-search"
        placeholder="Search client or project…"
        aria-label="Search projects"
      />
      <USelect
        v-model="statusFilter"
        :items="STATUSES.map((s) => ({ label: s, value: s }))"
        value-key="value"
        placeholder="All statuses"
        aria-label="Filter by status"
      />
      <USelect
        v-model="priorityFilter"
        :items="PRIORITIES.map((p) => ({ label: p, value: p }))"
        value-key="value"
        placeholder="All priorities"
        aria-label="Filter by priority"
      />
      <USelect
        v-model="sortBy"
        :items="[
          { label: 'Sort by due date', value: 'dueDate' },
          { label: 'Sort by start date', value: 'startDate' },
          { label: 'Sort by priority', value: 'priority' },
          { label: 'Sort by status', value: 'status' },
          { label: 'Sort by client', value: 'clientName' },
          { label: 'Sort by project', value: 'projectName' },
          { label: 'Sort by created', value: 'createdAt' },
        ]"
        value-key="value"
        class="sort-order"
        aria-label="Sort projects"
      />
      <UButton
        color="neutral"
        variant="outline"
        class="sort-order"
        :icon="sortOrder === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'"
        :aria-label="`Sort ${sortOrder === 'asc' ? 'ascending' : 'descending'}`"
        @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'"
      >
        {{ sortOrder === 'asc' ? 'Asc' : 'Desc' }}
      </UButton>
    </div>

    <div class="results-meta">
      <span>
        {{ store.loading ? 'Loading…' : `${store.projects.length} project${store.projects.length === 1 ? '' : 's'}` }}
      </span>
      <UButton
        v-if="filtersActive"
        color="primary"
        variant="link"
        class="clear-filters"
        type="button"
        @click="clearFilters"
      >
        Clear filters
      </UButton>
    </div>

    <UAlert
      v-if="store.error"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      :title="store.error"
      class="mb-4"
      role="alert"
    />

    <UAlert
      v-if="store.loading && store.projects.length === 0"
      color="info"
      variant="soft"
      icon="i-lucide-loader-circle"
      title="Loading projects…"
      class="mb-4"
      role="status"
    />

    <UEmpty v-else-if="!store.loading && store.projects.length === 0" icon="i-lucide-folder-open">
      <template #title>
        <h3>No projects found</h3>
      </template>
      <template #description>
        <p>Try adjusting your search or filters, or create a new project.</p>
      </template>
      <template #actions>
        <UButton to="/projects/new" icon="i-lucide-plus" color="primary">New Project</UButton>
      </template>
    </UEmpty>

    <ul v-else class="project-list" :class="{ 'is-refreshing': store.loading }">
      <li v-for="project in store.projects" :key="project.id">
        <UCard class="project-card">
          <div class="card-top">
            <div>
              <h3 class="project-name">
                <NuxtLink :to="`/projects/${project.id}/edit`">{{ project.projectName }}</NuxtLink>
              </h3>
              <p class="client-name">{{ project.clientName }}</p>
            </div>
            <div class="card-actions">
              <UButton
                :to="`/projects/${project.id}/edit`"
                color="neutral"
                variant="outline"
                size="xs"
                icon="i-lucide-pencil"
              >
                Edit
              </UButton>
              <UButton
                color="error"
                variant="outline"
                size="xs"
                icon="i-lucide-trash-2"
                @click="deleteTarget = project"
              >
                Delete
              </UButton>
            </div>
          </div>

          <p v-if="project.description" class="description">
            {{ project.description }}
          </p>

          <div class="card-meta">
            <ProjectStatusBadge :status="project.status" />
            <ProjectPriorityBadge :priority="project.priority" />
            <span
              class="date"
              :class="[`date-${dueInfo(project).kind}`, { completed: project.status === 'Completed' }]"
              :title="`Due ${project.dueDate}`"
            >
              {{ dueInfo(project).label }}
            </span>
          </div>
        </UCard>
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

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.stat {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 0.85rem 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  box-shadow: var(--shadow-sm);
}

.stat-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  border-radius: 10px;
  color: var(--color-primary);
  background: rgba(79, 70, 229, 0.12);
}

.stat-icon svg {
  width: 20px;
  height: 20px;
}

.stat-icon-progress {
  color: #2563eb;
  background: rgba(37, 99, 235, 0.12);
}

.stat-icon-completed {
  color: var(--color-success);
  background: rgba(22, 163, 74, 0.12);
}

.stat-icon-overdue {
  color: var(--color-danger);
  background: rgba(220, 38, 38, 0.12);
}

.stat-text {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.stat-value {
  font-size: 1.6rem;
  font-weight: 800;
  line-height: 1.1;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-weight: 600;
}

.stat-overdue .stat-value {
  color: var(--color-text-muted);
  transition: color 0.15s ease;
}

.stat-overdue.has-value .stat-value {
  color: var(--color-danger);
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

.results-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.9rem;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.clear-filters {
  padding: 0;
  font-size: 0.85rem;
}

.project-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
  transition: opacity 0.15s ease;
}

.project-list.is-refreshing {
  opacity: 0.5;
}

.project-card {
  height: 100%;
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
  white-space: nowrap;
}

.date-overdue {
  color: var(--color-danger);
  font-weight: 600;
}

.date-soon {
  color: #b45309;
  font-weight: 600;
}

.date.completed {
  color: var(--color-success);
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