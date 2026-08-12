<script setup lang="ts">
useSeoMeta({ title: 'New Project · Koda Project Tracker' });
</script>

<template>
  <section class="page">
    <header class="page-head">
      <h1>New Project</h1>
      <p class="subtitle">Add a new client project to the tracker.</p>
    </header>
    <ProjectForm mode="create" @cancel="navigateTo('/')" />
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