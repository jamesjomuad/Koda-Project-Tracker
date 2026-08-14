<script setup lang="ts">
const props = defineProps<{ slug: string }>();

const route = useRoute();

const isKanban = computed(() => route.path.endsWith('/kanban'));
</script>

<template>
  <div class="workspace-nav">
    <UButtonGroup>
      <UButton
        :to="`/${props.slug}/projects`"
        icon="i-lucide-list"
        :color="isKanban ? 'neutral' : 'primary'"
        :variant="isKanban ? 'outline' : 'solid'"
      >
        Projects
      </UButton>
      <UButton
        :to="`/${props.slug}/kanban`"
        icon="i-lucide-kanban"
        :color="isKanban ? 'primary' : 'neutral'"
        :variant="isKanban ? 'solid' : 'outline'"
      >
        Kanban
      </UButton>
    </UButtonGroup>
    <UButton to="/projects/new" icon="i-lucide-plus" color="primary">New Project</UButton>
  </div>
</template>

<style scoped>
.workspace-nav {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-shrink: 0;
}
</style>