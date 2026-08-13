<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus';
import type { KanbanColumn } from '../stores/projects';
import type { Project, ProjectStatus } from '#shared/types/project';

const props = defineProps<{
  columns: KanbanColumn[];
}>();

const emit = defineEmits<{
  'reorder-columns': [columns: KanbanColumn[]];
  'move': [project: Project, toStatus: ProjectStatus];
  'add': [status: ProjectStatus, name: string];
  'edit': [project: Project];
  'delete': [project: Project];
}>();

const localColumns = ref<KanbanColumn[]>([...props.columns]);

watch(
  () => props.columns,
  (newColumns) => {
    localColumns.value = [...newColumns];
  },
  { deep: true },
);
</script>

<template>
  <VueDraggable
    v-model="localColumns"
    direction="horizontal"
    :animation="200"
    ghost-class="column-ghost"
    chosen-class="column-chosen"
    drag-class="column-drag"
    handle=".column-handle"
    class="board"
    item-key="status"
    @update="emit('reorder-columns', localColumns)"
  >
    <div v-for="col in localColumns" :key="col.status" class="column-handle">
      <KanbanColumn
        :status="col.status"
        :label="col.label"
        :projects="col.projects"
        @move="(project, toStatus) => emit('move', project, toStatus)"
        @add="(status, name) => emit('add', status, name)"
        @edit="(p) => emit('edit', p)"
        @delete="(p) => emit('delete', p)"
      />
    </div>
  </VueDraggable>
</template>

<style scoped>
.board {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding-bottom: 1rem;
  align-items: flex-start;
  scroll-behavior: smooth;
}

.board::-webkit-scrollbar {
  height: 8px;
}

.board::-webkit-scrollbar-track {
  background: var(--color-border);
  border-radius: 4px;
}

.board::-webkit-scrollbar-thumb {
  background: var(--color-text-muted);
  border-radius: 4px;
}
</style>
