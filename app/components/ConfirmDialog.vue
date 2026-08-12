<script setup lang="ts">
const props = defineProps<{
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
}>();

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();
</script>

<template>
  <Teleport to="body">
    <div v-if="props.open" class="overlay" @click.self="emit('cancel')">
      <div class="dialog" role="dialog" aria-modal="true" :aria-label="props.title">
        <h3 class="dialog-title">{{ props.title }}</h3>
        <p class="dialog-message">{{ props.message }}</p>
        <div class="dialog-actions">
          <button class="btn btn-secondary" :disabled="props.busy" @click="emit('cancel')">Cancel</button>
          <button class="btn btn-danger" :disabled="props.busy" @click="emit('confirm')">
            {{ props.busy ? 'Deleting…' : (props.confirmLabel || 'Delete') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 18, 30, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 100;
}

.dialog {
  background: var(--color-surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
  padding: 1.5rem;
  max-width: 420px;
  width: 100%;
}

.dialog-title {
  margin: 0 0 0.5rem;
}

.dialog-message {
  margin: 0 0 1.25rem;
  color: var(--color-text-muted);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
}
</style>