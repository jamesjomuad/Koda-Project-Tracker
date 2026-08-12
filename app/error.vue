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
  <div class="error-page">
    <div class="error-card">
      <p class="status">{{ error.statusCode }}</p>
      <h1>{{ message }}</h1>
      <button class="btn btn-primary" @click="handleClear">Back to Projects</button>
    </div>
  </div>
</template>

<style scoped>
.error-page {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-card {
  text-align: center;
  padding: 2rem;
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