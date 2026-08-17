<script setup lang="ts">
import type { Comment } from '#shared/types/comment';
import { extractApiError } from '~/utils/api';

const props = defineProps<{
  projectId: number;
}>();

const comments = ref<Comment[]>([]);
const loading = ref(false);
const submitting = ref(false);
const deletingId = ref<number | null>(null);
const error = ref<string | null>(null);
const body = ref('');

async function load(): Promise<void> {
  loading.value = true;
  error.value = null;
  try {
    comments.value = await $fetch<Comment[]>(`/api/projects/${props.projectId}/comments`);
  } catch (e) {
    error.value = extractApiError(e).message;
  } finally {
    loading.value = false;
  }
}

async function addComment(): Promise<void> {
  const text = body.value.trim();
  if (!text || submitting.value) return;
  submitting.value = true;
  error.value = null;
  try {
    const comment = await $fetch<Comment>(`/api/projects/${props.projectId}/comments`, {
      method: 'POST',
      body: { body: text },
    });
    comments.value.push(comment);
    body.value = '';
  } catch (e) {
    error.value = extractApiError(e).message;
  } finally {
    submitting.value = false;
  }
}

async function removeComment(comment: Comment): Promise<void> {
  if (deletingId.value) return;
  deletingId.value = comment.id;
  error.value = null;
  try {
    await $fetch(`/api/projects/${props.projectId}/comments/${comment.id}`, { method: 'DELETE' });
    comments.value = comments.value.filter((c) => c.id !== comment.id);
  } catch (e) {
    error.value = extractApiError(e).message;
  } finally {
    deletingId.value = null;
  }
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

onMounted(load);
</script>

<template>
  <div class="comment-section">
    <h2 class="section-title">
      Comments
      <span v-if="comments.length" class="count">{{ comments.length }}</span>
    </h2>

    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      :title="error"
      class="mb-4"
      role="alert"
    />

    <div class="composer">
      <UTextarea
        v-model="body"
        :rows="3"
        placeholder="Add a comment…"
        aria-label="Comment body"
        :maxlength="2000"
      />
      <div class="composer-actions">
        <span class="hint">{{ body.length }}/2000</span>
        <UButton
          color="primary"
          icon="i-lucide-message-square-plus"
          :loading="submitting"
          :disabled="!body.trim()"
          @click="addComment"
        >
          Add Comment
        </UButton>
      </div>
    </div>

    <p v-if="loading" class="empty-state">Loading comments…</p>
    <p v-else-if="comments.length === 0" class="empty-state">No comments yet. Start the discussion.</p>

    <ul v-else class="comment-list">
      <li v-for="comment in comments" :key="comment.id" class="comment">
        <div class="comment-head">
          <span class="comment-date">{{ formatDateTime(comment.createdAt) }}</span>
          <UButton
            color="error"
            variant="ghost"
            size="xs"
            icon="i-lucide-trash-2"
            :loading="deletingId === comment.id"
            aria-label="Delete comment"
            @click="removeComment(comment)"
          />
        </div>
        <p class="comment-body">{{ comment.body }}</p>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.comment-section {
  margin-top: 1.5rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem;
  font-size: 1.1rem;
}

.count {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
  background: var(--color-border);
  border-radius: 999px;
  padding: 0.1rem 0.55rem;
}

.composer {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 1.25rem;
}

.composer-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
}

.hint {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.comment-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.comment {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 0.75rem 1rem;
}

.comment-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.comment-date {
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.comment-body {
  margin: 0.35rem 0 0;
  font-size: 0.9rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.empty-state {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}
</style>