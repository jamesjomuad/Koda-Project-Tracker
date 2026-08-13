<script setup lang="ts">
import type { Project } from '#shared/types/project';
import type { User } from '#shared/types/user';

const props = defineProps<{
  project: Project;
  users?: User[];
}>();

const emit = defineEmits<{
  edit: [project: Project];
  delete: [project: Project];
}>();

const assignedUser = computed(() => {
  if (!props.project.assignedTo || !props.users) return null;
  return props.users.find((u) => u.id === props.project.assignedTo) ?? null;
});

const initials = computed(() => {
  if (!assignedUser.value) return '';
  return assignedUser.value.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
});

function formatDate(dateStr: string): string {
  const [y = 0, m = 0, d = 0] = dateStr.split('-').map(Number);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  if (y !== new Date().getFullYear()) opts.year = 'numeric';
  return new Date(y, m - 1, d).toLocaleDateString('en-US', opts);
}

function dayDiff(dateStr: string): number {
  const [y = 0, m = 0, d = 0] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d).getTime();
  const now = new Date();
  const midnightToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((target - midnightToday) / 86_400_000);
}

const dueInfo = computed(() => {
  if (props.project.status === 'Completed') {
    return { label: `Done · ${formatDate(props.project.dueDate)}`, kind: 'normal' as const };
  }
  const diff = dayDiff(props.project.dueDate);
  if (diff < 0) return { label: `Overdue ${Math.abs(diff)}d`, kind: 'overdue' as const };
  if (diff === 0) return { label: 'Due today', kind: 'soon' as const };
  if (diff <= 7) return { label: `Due in ${diff}d`, kind: 'soon' as const };
  return { label: formatDate(props.project.dueDate), kind: 'normal' as const };
});
</script>

<template>
  <div class="kanban-card" @click.stop="emit('edit', props.project)">
    <div class="card-header">
      <h4 class="card-title">{{ props.project.projectName }}</h4>
      <UDropdownMenu
        :items="[
          [{ label: 'Edit', icon: 'i-lucide-pencil', onSelect: () => emit('edit', props.project) }],
          [{ label: 'Delete', icon: 'i-lucide-trash-2', onSelect: () => emit('delete', props.project) }],
        ]"
      >
        <UButton icon="i-lucide-ellipsis" color="neutral" variant="ghost" size="xs" @click.stop />
      </UDropdownMenu>
    </div>
    <p class="card-client">{{ props.project.clientName }}</p>
    <div class="card-footer">
      <ProjectPriorityBadge :priority="props.project.priority" />
      <span v-if="assignedUser" class="card-assignee" :title="assignedUser.name">
        <span class="avatar-initials">{{ initials }}</span>
      </span>
      <span
        class="card-due"
        :class="`card-due-${dueInfo.kind}`"
        :title="`Due ${props.project.dueDate}`"
      >
        {{ dueInfo.label }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.kanban-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.75rem;
  cursor: grab;
  transition: box-shadow 0.15s ease, border-color 0.15s ease;
  user-select: none;
  -webkit-user-select: none;
}

.kanban-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}

.card-title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.3;
  word-break: break-word;
}

.card-client {
  margin: 0.25rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.card-footer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.card-due {
  margin-left: auto;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.card-due-overdue {
  color: var(--color-danger);
  font-weight: 600;
}

.card-due-soon {
  color: #b45309;
  font-weight: 600;
}
</style>
