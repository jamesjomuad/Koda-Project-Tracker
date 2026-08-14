<script setup lang="ts">
import { extractApiError } from '../utils/api';

useSeoMeta({ title: 'Login · Koda Project Tracker' });

const route = useRoute();
const { login } = useAuth();

const username = ref('');
const password = ref('');
const error = ref<string | null>(null);
const fieldErrors = ref<Record<string, string>>({});
const busy = ref(false);

async function onSubmit(): Promise<void> {
  busy.value = true;
  error.value = null;
  fieldErrors.value = {};
  try {
    await login(username.value, password.value);
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/';
    await navigateTo(redirect, { replace: true });
  } catch (e) {
    const { message, issues } = extractApiError(e);
    error.value = message;
    fieldErrors.value = issues;
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <section class="auth-page">
    <UCard class="auth-card">
      <template #header>
        <div class="auth-head">
          <span class="auth-mark" aria-hidden="true">K</span>
          <h1>Welcome back</h1>
          <p>Sign in to your project tracker.</p>
        </div>
      </template>

      <UForm class="auth-form" :state="{ username, password }" @submit="onSubmit">
        <UFormField label="Username" :error="fieldErrors.username">
          <UInput
            v-model="username"
            name="username"
            type="text"
            autocomplete="username"
            required
            autofocus
            :error="!!fieldErrors.username"
            class="auth-input"
          />
        </UFormField>

        <UFormField label="Password" :error="fieldErrors.password">
          <UInput
            v-model="password"
            name="password"
            type="password"
            autocomplete="current-password"
            required
            :error="!!fieldErrors.password"
            class="auth-input"
          />
        </UFormField>

        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          icon="i-lucide-circle-alert"
          :title="error"
          role="alert"
        />

        <UButton class="auth-submit" type="submit" color="primary" block :loading="busy" :disabled="busy">
          {{ busy ? 'Signing in…' : 'Sign in' }}
        </UButton>
      </UForm>

      <template #footer>
        <p class="auth-hint">Assessment demo — username <code>admin</code>, password <code>admin123</code>.</p>
      </template>
    </UCard>
  </section>
</template>

<style scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 160px);
  padding: 2rem 1.25rem;
}

.auth-card {
  width: 100%;
  max-width: 400px;
}

.auth-head {
  text-align: center;
}

.auth-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: var(--color-primary);
  color: #fff;
  font-weight: 800;
  font-size: 1.2rem;
  margin-bottom: 0.75rem;
}

.auth-head h1 {
  margin: 0;
  font-size: 1.35rem;
}

.auth-head p {
  margin: 0.3rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.auth-input {
  width: 100%;
}

.auth-submit {
  margin-top: 0.25rem;
}

.auth-hint {
  margin: 0;
  text-align: center;
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.auth-hint code {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 0.1rem 0.35rem;
  font-size: 0.72rem;
}
</style>