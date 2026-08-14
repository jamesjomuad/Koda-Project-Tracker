<script setup lang="ts">
import { useProjectsStore, extractApiError } from '../stores/projects';
import type { Workspace, WorkspacePayload } from '#shared/types/workspace';

const props = withDefaults(defineProps<{
  mode: 'create' | 'edit';
  initial?: Workspace | null;
}>(), {
  initial: null,
});

const emit = defineEmits<{
  submitted: [workspace: Workspace];
  cancel: [];
}>();

const store = useProjectsStore();

const form = reactive<WorkspacePayload>({
  name: props.initial?.name ?? '',
  description: props.initial?.description ?? '',
});

const fieldErrors = ref<Record<string, string>>({});
const formError = ref<string | null>(null);
const submitting = ref(false);

function clearErrors(): void {
  fieldErrors.value = {};
  formError.value = null;
}

async function onSubmit(): Promise<void> {
  clearErrors();
  submitting.value = true;
  try {
    const workspace = props.mode === 'create'
      ? await store.createWorkspace(form)
      : await store.updateWorkspace(props.initial!.id, form);
    emit('submitted', workspace);
  } catch (e) {
    const { message, issues } = extractApiError(e);
    formError.value = message;
    fieldErrors.value = issues;
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <UForm class="workspace-form" :state="form" @submit="onSubmit">
    <UAlert
      v-if="formError"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      :title="formError"
    />

    <UFormField label="Workspace Name" required :error="fieldErrors.name">
      <UInput
        v-model="form.name"
        name="name"
        placeholder="e.g. Design Studio"
        autocomplete="organization"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Description">
      <UTextarea
        v-model="form.description"
        name="description"
        :rows="3"
        placeholder="What does this workspace handle?"
        class="w-full"
      />
    </UFormField>

    <div class="form-actions">
      <UButton color="neutral" variant="outline" :disabled="submitting" @click="emit('cancel')">
        Cancel
      </UButton>
      <UButton type="submit" color="primary" :loading="submitting" :disabled="submitting">
        {{ submitting ? 'Saving…' : (mode === 'create' ? 'Create Workspace' : 'Save Changes') }}
      </UButton>
    </div>
  </UForm>
</template>

<style scoped>
.workspace-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>