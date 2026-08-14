<script setup lang="ts">
import { useWorkspacesStore } from '../stores/workspaces';
import { extractApiError } from '~/utils/api';
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

const store = useWorkspacesStore();

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const form = reactive<WorkspacePayload>({
  name: props.initial?.name ?? '',
  slug: props.initial?.slug ?? '',
  description: props.initial?.description ?? '',
});

let slugDirty = props.mode === 'edit';

watch(() => form.name, (val) => {
  if (!slugDirty) form.slug = slugify(val);
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

    <UFormField label="Slug" required :error="fieldErrors.slug">
      <UInput
        v-model="form.slug"
        name="slug"
        placeholder="e.g. design-studio"
        @update:model-value="slugDirty = true"
        class="w-full"
      />
      <p class="field-hint">Used in the URL, e.g. /design-studio/projects</p>
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

.field-hint {
  margin: 0.35rem 0 0;
  font-size: 0.78rem;
  color: var(--color-text-muted);
}
</style>