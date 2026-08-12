<script setup lang="ts">
import type { NuxtError } from '#app';

const props = defineProps<{ error: NuxtError }>();

const message = computed(() => {
  if (props.error.statusCode === 404) return 'The page you are looking for does not exist.';
  if (props.error.statusCode === 500) return 'Something went wrong on the server.';
  return props.error.message || 'An unexpected error occurred.';
});

function handleClear(): void {
  clearError({ redirect: '/' });
}
</script>

<template>
  <UCard class="error-page">
    <p class="status">{{ error.statusCode }}</p>
    <h1>{{ message }}</h1>
    <UButton color="primary" @click="handleClear">Back to Projects</UButton>
  </UCard>
</template>

<style scoped>
.error-page {
  margin: 8vh auto;
  max-width: 420px;
  text-align: center;
}

.status {
  font-size: 3rem;
  font-weight: 800;
  color: var(--color-primary);
  margin: 0;
}

h1 {
  margin: 0.5rem 0 1.5rem;
  color: var(--color-text-muted);
  font-size: 1.1rem;
  font-weight: 500;
}
</style>