<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from 'vue';

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

const dialogRef = ref<HTMLElement | null>(null);
const confirmRef = ref<HTMLButtonElement | null>(null);
let lastFocused: HTMLElement | null = null;

const dialogTitleId = 'confirm-dialog-title';
const dialogMessageId = 'confirm-dialog-message';

function onKeydown(e: KeyboardEvent): void {
  if (!props.open) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    if (!props.busy) emit('cancel');
  }
  if (e.key === 'Tab' && dialogRef.value) {
    const focusables = dialogRef.value.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusables.length === 0) return;
    const first = focusables[0]!;
    const last = focusables[focusables.length - 1]!;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

onUnmounted(() => {
  document.body.style.overflow = '';
});

watch(
  () => props.open,
  (open) => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    nextTick(() => {
      if (open) {
        lastFocused = document.activeElement as HTMLElement | null;
        confirmRef.value?.focus();
      } else {
        lastFocused?.focus();
        lastFocused = null;
      }
    });
  },
);
</script>

<template>
  <Teleport to="body">
    <div v-if="props.open" class="overlay" @click.self="props.busy ? null : emit('cancel')">
      <div
        ref="dialogRef"
        class="dialog"
        role="alertdialog"
        aria-modal="true"
        :aria-labelledby="dialogTitleId"
        :aria-describedby="dialogMessageId"
        @keydown="onKeydown"
      >
        <h3 :id="dialogTitleId" class="dialog-title">{{ props.title }}</h3>
        <p :id="dialogMessageId" class="dialog-message">{{ props.message }}</p>
        <div class="dialog-actions">
          <button class="btn btn-secondary" :disabled="props.busy" @click="emit('cancel')">Cancel</button>
          <button ref="confirmRef" class="btn btn-danger" :disabled="props.busy" @click="emit('confirm')">
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