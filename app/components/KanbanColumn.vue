<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus';
import type { Project, ProjectStatus } from '#shared/types/project';
import type { User } from '#shared/types/user';

const props = defineProps<{
  status: ProjectStatus;
  label: string;
  projects: Project[];
  users?: User[];
}>();

const emit = defineEmits<{
  'move': [project: Project, toStatus: ProjectStatus];
  'add': [status: ProjectStatus, name: string];
  'edit': [project: Project];
  'delete': [project: Project];
}>();

const localProjects = ref<Project[]>([...props.projects]);

watch(
  () => props.projects,
  (newProjects) => {
    localProjects.value = [...newProjects];
  },
  { deep: true },
);

function onCardAdd(evt: any): void {
  const added = localProjects.value[evt.newIndex as number] as Project | undefined;
  if (added && added.status !== props.status) {
    emit('move', added, props.status);
  }
}

const showQuickAdd = ref(false);
const quickAddName = ref('');
const quickAddInput = ref<HTMLInputElement | null>(null);

function openQuickAdd(): void {
  showQuickAdd.value = true;
  nextTick(() => quickAddInput.value?.focus());
}

function submitQuickAdd(): void {
  const name = quickAddName.value.trim();
  if (!name) return;
  emit('add', props.status, name);
  quickAddName.value = '';
  showQuickAdd.value = false;
}

function cancelQuickAdd(): void {
  showQuickAdd.value = false;
  quickAddName.value = '';
}

const colorMap: Record<ProjectStatus, 'info' | 'warning' | 'neutral' | 'success'> = {
  Planning: 'info',
  'In Progress': 'warning',
  'On Hold': 'neutral',
  Completed: 'success',
};
</script>

<template>
  <div class="kanban-column">
    <div class="column-header">
      <div class="column-title-row">
        <UBadge :color="colorMap[props.status]" variant="subtle" size="sm">
          {{ props.label }}
        </UBadge>
        <span class="column-count">{{ localProjects.length }}</span>
      </div>
      <UButton
        icon="i-lucide-plus"
        color="neutral"
        variant="ghost"
        size="xs"
        aria-label="Add task"
        @click="openQuickAdd"
      />
    </div>

    <VueDraggable
      v-model="localProjects"
      group="kanban-cards"
      :animation="150"
      ghost-class="card-ghost"
      chosen-class="card-chosen"
      drag-class="card-drag"
      :empty-insert-threshold="50"
      item-key="id"
      class="card-list"
      @add="onCardAdd"
    >
      <div v-for="project in localProjects" :key="project.id">
        <KanbanCard
          :project="project"
          :users="props.users"
          @edit="(p) => emit('edit', p)"
          @delete="(p) => emit('delete', p)"
        />
      </div>
    </VueDraggable>

    <div v-if="localProjects.length === 0 && !showQuickAdd" class="empty-state">
      <p>No projects yet</p>
      <UButton
        color="primary"
        variant="link"
        size="xs"
        icon="i-lucide-plus"
        @click="openQuickAdd"
      >
        Add one
      </UButton>
    </div>

    <div v-if="showQuickAdd" class="quick-add">
      <UInput
        ref="quickAddInput"
        v-model="quickAddName"
        placeholder="Project name…"
        size="sm"
        autofocus
        @keydown.enter="submitQuickAdd"
        @keydown.escape="cancelQuickAdd"
        @blur="quickAddName.trim() ? submitQuickAdd() : cancelQuickAdd()"
      />
      <div class="quick-add-actions">
        <UButton size="xs" color="primary" @click="submitQuickAdd">Add</UButton>
        <UButton size="xs" color="neutral" variant="ghost" @click="cancelQuickAdd">Cancel</UButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.kanban-column {
  min-width: 280px;
  max-width: 320px;
  width: 100%;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  max-height: calc(100vh - 180px);
}

.column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0.75rem 0.5rem;
  flex-shrink: 0;
}

.column-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.column-count {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.card-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 0.5rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-height: 60px;
}

.empty-state {
  text-align: center;
  padding: 1.5rem 0.5rem;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.empty-state p {
  margin: 0 0 0.25rem;
}

.quick-add {
  padding: 0.5rem 0.75rem 0.75rem;
  border-top: 1px solid var(--color-border);
}

.quick-add-actions {
  display: flex;
  gap: 0.35rem;
  margin-top: 0.35rem;
}
</style>
