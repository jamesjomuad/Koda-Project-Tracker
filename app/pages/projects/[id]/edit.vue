<script setup lang="ts">
import type { Project } from '#shared/types/project';

useSeoMeta({ title: 'Edit Project · Koda Project Tracker' });

const route = useRoute();
const id = Number(route.params.id);

const project = ref<Project | null>(null);
const loadError = ref<string | null>(null);

async function load(): Promise<void> {
  try {
    project.value = await $fetch<Project>(`/api/projects/${id}`);
  } catch (e) {
    loadError.value = (e as { data?: { error?: { message?: string } } })?.data?.error?.message ?? 'Failed to load project.';
  }
}

onMounted(load);
</script>

<template>
  <section class="page">
    <header class="page-head">
      <h1>Edit Project</h1>
      <p class="subtitle">Update the details of this project.</p>
    </header>

    <p v-if="loadError" class="alert alert-error" role="alert">{{ loadError }}</p>
    <div v-else-if="!project" class="empty-state" role="status">Loading project…</div>
    <ProjectForm
      v-else
      mode="edit"
      :initial="project"
      @cancel="navigateTo('/')"
    />
  </section>
</template>

<style scoped>
.page {
  max-width: 720px;
  margin: 0 auto;
}

.page-head h1 {
  margin: 0;
  font-size: 1.5rem;
}

.subtitle {
  margin: 0.25rem 0 1.25rem;
  color: var(--color-text-muted);
}
</style>