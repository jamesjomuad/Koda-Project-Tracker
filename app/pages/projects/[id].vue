<script setup lang="ts">
import type { Project } from '#shared/types/project';
import { useWorkspacesStore } from '../../stores/workspaces';
import { useUsersStore } from '../../stores/users';
import { extractApiError } from '~/utils/api';

const route = useRoute();
const id = Number(route.params.id);

const project = ref<Project | null>(null);
const loadError = ref<string | null>(null);

const workspacesStore = useWorkspacesStore();
const usersStore = useUsersStore();

useSeoMeta({
  title: () => (project.value ? `${project.value.projectName} · Koda` : 'Project · Koda'),
});

async function load(): Promise<void> {
  try {
    project.value = await $fetch<Project>(`/api/projects/${id}`);
  } catch (e) {
    loadError.value = extractApiError(e).message;
  }
}

const workspace = computed(() =>
  project.value ? workspacesStore.workspaces.find((w) => w.id === project.value!.workspaceId) : null,
);

const assignedUser = computed(() => {
  if (!project.value?.assignedTo) return null;
  return usersStore.users.find((u) => u.id === project.value!.assignedTo) ?? null;
});

function formatDate(dateStr: string): string {
  const [y = 0, m = 0, d = 0] = dateStr.split('-').map(Number);
  const opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
  return new Date(y, m - 1, d).toLocaleDateString('en-US', opts);
}

onMounted(async () => {
  await load();
  if (workspacesStore.workspaces.length === 0) await workspacesStore.fetchWorkspaces();
  usersStore.fetchUsers();
});
</script>

<template>
  <section class="page">
    <UAlert
      v-if="loadError"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      :title="loadError"
      class="mb-4"
      role="alert"
    />
    <UAlert
      v-else-if="!project"
      color="info"
      variant="soft"
      icon="i-lucide-loader-circle"
      title="Loading project…"
      class="mb-4"
      role="status"
    />

    <template v-else>
      <header class="page-head">
        <div>
          <NuxtLink
            v-if="workspace"
            :to="`/${workspace.slug}/projects`"
            class="back-link"
            icon="i-lucide-arrow-left"
          >
            <span class="back-icon" aria-hidden="true">←</span>
            {{ workspace.name }}
          </NuxtLink>
          <h1>{{ project.projectName }}</h1>
          <p class="client-name">{{ project.clientName }}</p>
        </div>
        <div class="actions">
          <UButton
            :to="`/projects/${project.id}/edit`"
            color="neutral"
            variant="outline"
            icon="i-lucide-pencil"
          >
            Edit
          </UButton>
        </div>
      </header>

      <p v-if="project.description" class="description">{{ project.description }}</p>

      <UCard class="details-card">
        <dl class="details">
          <div class="detail">
            <dt>Status</dt>
            <dd><ProjectStatusBadge :status="project.status" /></dd>
          </div>
          <div class="detail">
            <dt>Priority</dt>
            <dd><ProjectPriorityBadge :priority="project.priority" /></dd>
          </div>
          <div class="detail">
            <dt>Start Date</dt>
            <dd>{{ formatDate(project.startDate) }}</dd>
          </div>
          <div class="detail">
            <dt>Due Date</dt>
            <dd>{{ formatDate(project.dueDate) }}</dd>
          </div>
          <div class="detail">
            <dt>Assigned To</dt>
            <dd>{{ assignedUser?.name ?? 'Unassigned' }}</dd>
          </div>
        </dl>
      </UCard>

      <CommentSection :project-id="project.id" />
    </template>
  </section>
</template>

<style scoped>
.page {
  max-width: 720px;
  margin: 0 auto;
}

.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.page-head h1 {
  margin: 0;
  font-size: 1.6rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  text-decoration: none;
  margin-bottom: 0.35rem;
}

.back-link:hover {
  color: var(--color-primary);
  text-decoration: none;
}

.back-icon {
  font-size: 1rem;
  line-height: 1;
}

.client-name {
  margin: 0.25rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.95rem;
}

.actions {
  flex-shrink: 0;
}

.description {
  margin: 0 0 1.25rem;
  color: var(--color-text-muted);
  line-height: 1.6;
  white-space: pre-wrap;
}

.details-card {
  margin-bottom: 0;
}

.details {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem 2rem;
}

.detail dt {
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
}

.detail dd {
  margin: 0.2rem 0 0;
  font-size: 0.95rem;
}
</style>