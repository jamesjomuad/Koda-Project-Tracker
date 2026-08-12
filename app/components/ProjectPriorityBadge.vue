<script setup lang="ts">
import type { ProjectPriority } from '#shared/types/project';

const props = defineProps<{ priority: ProjectPriority }>();

const colorMap: Record<ProjectPriority, 'neutral' | 'info' | 'error'> = {
  Low: 'neutral',
  Medium: 'info',
  High: 'error',
};
</script>

<template>
  <UBadge :color="colorMap[props.priority]" variant="subtle" size="sm">{{ props.priority }}</UBadge>
</template>