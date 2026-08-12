<script setup lang="ts">
import { STATUSES, PRIORITIES } from '../composables/useProjects';
import { extractApiError } from '../composables/useProjects';
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
    const { createProject, updateProject } = useProjects();
    const project = props.mode === 'create'
      ? await createProject(form)
      : await updateProject(props.initial!.id, form);
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
  <form class="project-form" novalidate @submit.prevent="onSubmit">
    <div v-if="formError" class="alert alert-error" role="alert">{{ formError }}</div>

    <div class="form-grid">
      <div class="field">
        <label for="clientName">Client Name *</label>
        <input
          id="clientName"
          v-model="form.clientName"
          class="input"
          :class="{ 'input-error': fieldErrors.clientName }"
          type="text"
          placeholder="e.g. Acme Corporation"
          autocomplete="organization"
        />
        <p v-if="fieldErrors.clientName" class="field-error">{{ fieldErrors.clientName }}</p>
      </div>

      <div class="field">
        <label for="projectName">Project Name *</label>
        <input
          id="projectName"
          v-model="form.projectName"
          class="input"
          :class="{ 'input-error': fieldErrors.projectName }"
          type="text"
          placeholder="e.g. Corporate Website Redesign"
        />
        <p v-if="fieldErrors.projectName" class="field-error">{{ fieldErrors.projectName }}</p>
      </div>
    </div>

    <div class="field">
      <label for="description">Description</label>
      <textarea
        id="description"
        v-model="form.description"
        class="input"
        rows="3"
        placeholder="What is this project about?"
      ></textarea>
    </div>

    <div class="form-grid">
      <div class="field">
        <label for="status">Status *</label>
        <select id="status" v-model="form.status" class="select" :class="{ 'input-error': fieldErrors.status }">
          <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
        </select>
        <p v-if="fieldErrors.status" class="field-error">{{ fieldErrors.status }}</p>
      </div>

      <div class="field">
        <label for="priority">Priority *</label>
        <select id="priority" v-model="form.priority" class="select" :class="{ 'input-error': fieldErrors.priority }">
          <option v-for="p in PRIORITIES" :key="p" :value="p">{{ p }}</option>
        </select>
        <p v-if="fieldErrors.priority" class="field-error">{{ fieldErrors.priority }}</p>
      </div>
    </div>

    <div class="form-grid">
      <div class="field">
        <label for="startDate">Start Date *</label>
        <input
          id="startDate"
          v-model="form.startDate"
          class="input"
          :class="{ 'input-error': fieldErrors.startDate }"
          type="date"
        />
        <p v-if="fieldErrors.startDate" class="field-error">{{ fieldErrors.startDate }}</p>
      </div>

      <div class="field">
        <label for="dueDate">Due Date *</label>
        <input
          id="dueDate"
          v-model="form.dueDate"
          class="input"
          :class="{ 'input-error': fieldErrors.dueDate }"
          type="date"
        />
        <p v-if="fieldErrors.dueDate" class="field-error">{{ fieldErrors.dueDate }}</p>
      </div>
    </div>

    <div class="form-actions">
      <button type="button" class="btn btn-secondary" :disabled="submitting" @click="emit('cancel')">Cancel</button>
      <button type="submit" class="btn btn-primary" :disabled="submitting">
        {{ submitting ? 'Saving…' : (mode === 'create' ? 'Create Project' : 'Save Changes') }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.project-form {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-top: 0.5rem;
}

@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>