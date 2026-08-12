<script setup lang="ts">
import type { ProjectStatus } from '#shared/types/project';

const props = defineProps<{ status: ProjectStatus }>();
</script>

<template>
  <span class="badge" :class="`badge-${props.status.toLowerCase().replace(/\s+/g, '-')}`">
    {{ props.status }}
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

.badge-planning {
  background: #eff6ff;
  color: #1d4ed8;
}

.badge-in-progress {
  background: #fef3c7;
  color: #92400e;
}

.badge-on-hold {
  background: #f1f5f9;
  color: #475569;
}

.badge-completed {
  background: #dcfce7;
  color: #15803d;
}
</style>