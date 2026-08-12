<script setup lang="ts">
import type { ProjectPriority } from '#shared/types/project';

const props = defineProps<{ priority: ProjectPriority }>();
</script>

<template>
  <span class="badge" :class="`badge-${props.priority.toLowerCase()}`">
    {{ props.priority }}
  </span>
</template>

<style scoped>
.badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge-low {
  background: #f1f5f9;
  color: #475569;
}

.badge-medium {
  background: #e0e7ff;
  color: #4338ca;
}

.badge-high {
  background: #fee2e2;
  color: #b91c1c;
}
</style>