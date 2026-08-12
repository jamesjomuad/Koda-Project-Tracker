<script setup lang="ts">
const { user, logout } = useAuth();
const route = useRoute();
const isLogin = computed(() => route.path === '/login');

async function onLogout(): Promise<void> {
  await logout();
  await navigateTo('/login');
}
</script>

<template>
  <div class="layout">
    <header class="header">
      <div class="header-inner">
        <NuxtLink to="/" class="brand">
          <span class="brand-mark" aria-hidden="true">K</span>
          <span class="brand-name">Koda Project Tracker</span>
        </NuxtLink>
        <nav v-if="!isLogin" class="nav">
          <NuxtLink to="/" class="nav-link">Projects</NuxtLink>
          <NuxtLink to="/projects/new" class="btn btn-primary">+ New Project</NuxtLink>
          <span v-if="user" class="nav-user" :title="`Signed in as ${user.username}`">
            {{ user.username }}
          </span>
          <button v-if="user" type="button" class="btn btn-secondary btn-sm" @click="onLogout">
            Log out
          </button>
        </nav>
      </div>
    </header>
    <main class="page-body">
      <slot />
    </main>
    <footer class="footer">
      <p>Client Project Tracker · Technical assessment</p>
    </footer>
  </div>
</template>

<style scoped>
.header {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 1.25rem;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--color-text);
  font-weight: 700;
  font-size: 1.05rem;
  text-decoration: none;
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: var(--color-primary);
  color: #fff;
  font-weight: 800;
}

.nav {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.nav-link {
  color: var(--color-text-muted);
  font-weight: 600;
  font-size: 0.9rem;
}

.nav-link:hover {
  color: var(--color-text);
}

.nav-link.router-link-exact-active {
  color: var(--color-primary);
}

.nav-user {
  color: var(--color-text-muted);
  font-size: 0.85rem;
  font-weight: 600;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.page-body {
  padding: 1.5rem 1.25rem 3rem;
  min-height: calc(100vh - 160px);
}

.footer {
  border-top: 1px solid var(--color-border);
  padding-top: 1rem;
  padding-bottom: 1rem;
}

.footer p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}
</style>