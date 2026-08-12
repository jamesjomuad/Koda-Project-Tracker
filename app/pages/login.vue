<script setup lang="ts">
import { extractApiError } from '../composables/useProjects';

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
    <div class="auth-card">
      <header class="auth-head">
        <span class="auth-mark" aria-hidden="true">K</span>
        <h1>Welcome back</h1>
        <p>Sign in to your project tracker.</p>
      </header>

      <form class="auth-form" novalidate @submit.prevent="onSubmit">
        <div class="field">
          <label for="username">Username</label>
          <input
            id="username"
            v-model="username"
            class="input"
            :class="{ 'input-error': fieldErrors.username }"
            type="text"
            name="username"
            autocomplete="username"
            required
            autofocus
          />
          <p v-if="fieldErrors.username" class="field-error">{{ fieldErrors.username }}</p>
        </div>

        <div class="field">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            class="input"
            :class="{ 'input-error': fieldErrors.password }"
            type="password"
            name="password"
            autocomplete="current-password"
            required
          />
          <p v-if="fieldErrors.password" class="field-error">{{ fieldErrors.password }}</p>
        </div>

        <p v-if="error" class="alert alert-error" role="alert">{{ error }}</p>

        <button class="btn btn-primary auth-submit" type="submit" :disabled="busy">
          {{ busy ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

      <p class="auth-hint">Assessment demo — username <code>admin</code>, password <code>admin123</code>.</p>
    </div>
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
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
  padding: 2rem 1.75rem;
}

.auth-head {
  text-align: center;
  margin-bottom: 1.5rem;
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

.auth-submit {
  width: 100%;
  justify-content: center;
  margin-top: 0.25rem;
}

.auth-hint {
  margin: 1.25rem 0 0;
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