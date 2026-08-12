<script setup lang="ts">
const props = withDefaults(defineProps<{
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
}>(), {
  confirmLabel: 'Delete',
  busy: false,
});

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

function onUpdateOpen(open: boolean): void {
  if (!open && !props.busy) emit('cancel');
}
</script>

<template>
  <UModal
    :open="props.open"
    :dismissible="!props.busy"
    :title="props.title"
    :description="props.message"
    @update:open="onUpdateOpen"
  >
    <template #footer>
      <UButton color="neutral" variant="outline" :disabled="props.busy" @click="emit('cancel')">
        Cancel
      </UButton>
      <UButton color="error" :loading="props.busy" :disabled="props.busy" @click="emit('confirm')">
        {{ props.busy ? 'Deleting…' : props.confirmLabel }}
      </UButton>
    </template>
  </UModal>
</template>