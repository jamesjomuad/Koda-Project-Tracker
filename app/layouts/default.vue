<script setup lang="ts">
import { useWorkspacesStore } from '../stores/workspaces';

const { user, logout } = useAuth();
const route = useRoute();
const store = useWorkspacesStore();
const isLogin = computed(() => route.path === '/login');

const workspaceItems = computed(() => [
  { label: 'All workspaces', value: null },
  ...store.workspaces.map((w) => ({ label: w.name, value: w.id })),
]);

const activeWorkspace = computed(
  () => store.workspaces.find((w) => w.id === store.activeWorkspaceId) ?? null,
);

const projectsHref = computed(
  () => (activeWorkspace.value ? `/${activeWorkspace.value.slug}/projects` : '/'),
);

const boardHref = computed(
  () => (activeWorkspace.value ? `/${activeWorkspace.value.slug}/kanban` : '/'),
);

async function onLogout(): Promise<void> {
  await logout();
  await navigateTo('/login');
}

async function onWorkspaceSelect(id: number | null): Promise<void> {
  if (store.activeWorkspaceId !== id) store.setActiveWorkspace(id);
  const target = id === null ? '/' : `/${store.workspaces.find((w) => w.id === id)?.slug ?? ''}/projects`;
  if (route.path !== target) await navigateTo(target);
}

onMounted(() => {
  if (store.workspaces.length === 0) store.fetchWorkspaces();
});
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
          <NuxtLink :to="projectsHref" class="nav-link">Projects</NuxtLink>
          <NuxtLink :to="boardHref" class="nav-link">Board</NuxtLink>
          <USelectMenu
            v-if="store.workspaces.length > 0"
            :model-value="store.activeWorkspaceId"
            :items="workspaceItems"
            value-key="value"
            leading-icon="i-lucide-search"
            :search-input="{ placeholder: 'Search workspaces…' }"
            placeholder="Search workspace"
            aria-label="Search and select workspace"
            class="workspace-switcher"
            @update:model-value="(id: number | null) => onWorkspaceSelect(id)"
          />
          <UButton to="/projects/new" icon="i-lucide-plus" color="primary">New Project</UButton>
          <span v-if="user" class="nav-user" :title="`Signed in as ${user.username}`">
            {{ user.username }}
          </span>
          <UButton
            v-if="user"
            icon="i-lucide-log-out"
            color="neutral"
            variant="outline"
            size="xs"
            @click="onLogout"
          >
            Log out
          </UButton>
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
  position: sticky;
  top: 0;
  z-index: 30;
}

.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
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

.workspace-switcher {
  min-width: 210px;
  max-width: 260px;
}

@media (max-width: 900px) {
  .workspace-switcher {
    min-width: 150px;
    max-width: 170px;
  }
}

.page-body {
  flex: 1;
  padding: 1.5rem 1.25rem 3rem;
}

.footer {
  border-top: 1px solid var(--color-border);
  padding: 1rem 1.25rem;
  text-align: center;
}

.footer p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  letter-spacing: 0.01em;
}
</style>