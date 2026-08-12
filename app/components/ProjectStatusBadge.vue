<script setup lang="ts">
import type { ProjectStatus } from '#shared/types/project';

const props = defineProps<{ status: ProjectStatus }>();

const colorMap: Record<ProjectStatus, 'info' | 'warning' | 'neutral' | 'success'> = {
  Planning: 'info',
  'In Progress': 'warning',
  'On Hold': 'neutral',
  Completed: 'success',
};
</script>

<template>
  <UBadge :color="colorMap[props.status]" variant="subtle" size="sm">{{ props.status }}</UBadge>
</template>