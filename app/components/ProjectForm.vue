<script setup lang="ts">
import { STATUSES, PRIORITIES, useProjectsStore } from '../stores/projects';
import { extractApiError } from '../stores/projects';
import type { ProjectPayload, Project } from '#shared/types/project';

const props = withDefaults(defineProps<{
  mode: 'create' | 'edit';
  initial?: Project | null;
}>(), {
  initial: null,
});

const emit = defineEmits<{
  submitted: [project: Project];
  cancel: [];
}>();

const router = useRouter();

const form = reactive<ProjectPayload>({
  clientName: props.initial?.clientName ?? '',
  projectName: props.initial?.projectName ?? '',
  description: props.initial?.description ?? '',
  status: props.initial?.status ?? 'Planning',
  priority: props.initial?.priority ?? 'Medium',
  startDate: props.initial?.startDate ?? '',
  dueDate: props.initial?.dueDate ?? '',
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
    const store = useProjectsStore();
    const project = props.mode === 'create'
      ? await store.createProject(form)
      : await store.updateProject(props.initial!.id, form);
    emit('submitted', project);
    router.push('/');
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
  <UForm class="project-form" :state="form" @submit="onSubmit">
    <UAlert
      v-if="formError"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      :title="formError"
      class="mb-4"
    />

    <div class="form-grid">
      <UFormField label="Client Name" required :error="fieldErrors.clientName">
        <UInput
          v-model="form.clientName"
          name="clientName"
          placeholder="e.g. Acme Corporation"
          autocomplete="organization"
          :error="!!fieldErrors.clientName"
        />
      </UFormField>

      <UFormField label="Project Name" required :error="fieldErrors.projectName">
        <UInput
          v-model="form.projectName"
          name="projectName"
          placeholder="e.g. Corporate Website Redesign"
          :error="!!fieldErrors.projectName"
        />
      </UFormField>
    </div>

    <UFormField label="Description">
      <UTextarea
        v-model="form.description"
        name="description"
        :rows="3"
        placeholder="What is this project about?"
      />
    </UFormField>

    <div class="form-grid">
      <UFormField label="Status" required :error="fieldErrors.status">
        <USelect
          v-model="form.status"
          name="status"
          :items="STATUSES.map((s) => ({ label: s, value: s }))"
          value-key="value"
          :error="!!fieldErrors.status"
        />
      </UFormField>

      <UFormField label="Priority" required :error="fieldErrors.priority">
        <USelect
          v-model="form.priority"
          name="priority"
          :items="PRIORITIES.map((p) => ({ label: p, value: p }))"
          value-key="value"
          :error="!!fieldErrors.priority"
        />
      </UFormField>
    </div>

    <div class="form-grid">
      <UFormField label="Start Date" required :error="fieldErrors.startDate">
        <UInput
          v-model="form.startDate"
          name="startDate"
          type="date"
          :error="!!fieldErrors.startDate"
        />
      </UFormField>

      <UFormField label="Due Date" required :error="fieldErrors.dueDate">
        <UInput
          v-model="form.dueDate"
          name="dueDate"
          type="date"
          :error="!!fieldErrors.dueDate"
        />
      </UFormField>
    </div>

    <div class="form-actions">
      <UButton color="neutral" variant="outline" :disabled="submitting" @click="emit('cancel')">
        Cancel
      </UButton>
      <UButton type="submit" color="primary" :loading="submitting" :disabled="submitting">
        {{ submitting ? 'Saving…' : (mode === 'create' ? 'Create Project' : 'Save Changes') }}
      </UButton>
    </div>
  </UForm>
</template>

<style scoped>
.project-form {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>