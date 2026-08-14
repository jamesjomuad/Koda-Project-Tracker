<script setup lang="ts">
import { STATUSES } from '#shared/types/project';
import type { Project, ProjectStatus } from '#shared/types/project';
import { useWorkspacesStore } from '../stores/workspaces';

useSeoMeta({ title: 'Workspaces · Koda Project Tracker' });

const store = useWorkspacesStore();

/** Unscoped project list used to derive per-workspace status breakdowns. */
const allProjects = ref<Project[]>([]);

async function loadAllProjects(): Promise<void> {
  try {
    allProjects.value = await $fetch<Project[]>('/api/projects');
  } catch {
    allProjects.value = [];
  }
}

type WorkspaceStats = Record<ProjectStatus, number>;

const workspaceStats = computed(() => {
  const map = new Map<number, WorkspaceStats>();
  for (const p of allProjects.value) {
    const stats = map.get(p.workspaceId) ?? { Planning: 0, 'In Progress': 0, 'On Hold': 0, Completed: 0 };
    stats[p.status] += 1;
    map.set(p.workspaceId, stats);
  }
  return map;
});

interface Seg {
  label: ProjectStatus;
  count: number;
  pct: number;
  cls: string;
}

const SEG_CLASSES: Record<ProjectStatus, string> = {
  Planning: 'seg-planning',
  'In Progress': 'seg-progress',
  'On Hold': 'seg-hold',
  Completed: 'seg-completed',
};

function segments(stats: WorkspaceStats | undefined): Seg[] {
  const s = stats ?? { Planning: 0, 'In Progress': 0, 'On Hold': 0, Completed: 0 };
  const total = STATUSES.reduce((acc, st) => acc + s[st], 0) || 1;
  return STATUSES.map((st) => ({
    label: st,
    count: s[st],
    pct: (s[st] / total) * 100,
    cls: SEG_CLASSES[st],
  }));
}

const WS_COLORS = [
  { bg: '#4f46e5', fg: '#eef2ff' },
  { bg: '#7c3aed', fg: '#f5f3ff' },
  { bg: '#0284c7', fg: '#f0f9ff' },
  { bg: '#059669', fg: '#ecfdf5' },
  { bg: '#d97706', fg: '#fffbeb' },
  { bg: '#e11d48', fg: '#fff1f2' },
];

function workspaceColor(id: number): { bg: string; fg: string } {
  return WS_COLORS[(id - 1) % WS_COLORS.length] ?? { bg: '#4f46e5', fg: '#eef2ff' };
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function openWorkspace(id: number, slug: string): void {
  if (store.activeWorkspaceId !== id) store.setActiveWorkspace(id);
  navigateTo(`/${slug}/projects`);
}

onMounted(() => {
  if (store.workspaces.length === 0) store.fetchWorkspaces();
  loadAllProjects();
});
</script>

<template>
  <section>
    <header class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Koda · Project Tracker</p>
        <h1 class="hero-title">Workspaces</h1>
        <p class="subtitle">
          Pick a workspace to open its projects and board. Each workspace keeps its own clients, deadlines, and workflow.
        </p>
      </div>
      <div class="hero-actions">
        <UButton to="/workspaces" color="neutral" variant="outline" icon="i-lucide-settings-2">
          Manage
        </UButton>
        <UButton to="/workspaces?new=1" color="primary" icon="i-lucide-plus">New Workspace</UButton>
      </div>
    </header>

    <h2 class="section-title">
      Workspaces
      <span class="count-chip">{{ store.workspaces.length }}</span>
    </h2>

    <ul class="workspace-grid" aria-label="Workspaces">
      <li
        v-for="w in store.workspaces"
        :key="w.id"
        class="workspace-card"
        role="button"
        tabindex="0"
        @click="openWorkspace(w.id, w.slug)"
        @keydown.enter="openWorkspace(w.id, w.slug)"
      >
        <span
          class="monogram"
          :style="{ background: workspaceColor(w.id).bg, color: workspaceColor(w.id).fg }"
          aria-hidden="true"
        >
          {{ initials(w.name) }}
        </span>
        <div class="ws-body">
          <h3 class="ws-name">{{ w.name }}</h3>
          <p class="ws-desc">{{ w.description }}</p>
          <div class="ws-meta">
            <span class="ws-count">{{ w.projectCount }} project{{ w.projectCount === 1 ? '' : 's' }}</span>
            <span class="ws-open" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </span>
          </div>
          <div
            class="ws-segments"
            role="img"
            :aria-label="segments(workspaceStats.get(w.id)).map((s) => `${s.count} ${s.label}`).join(', ')"
          >
            <span
              v-for="seg in segments(workspaceStats.get(w.id))"
              :key="seg.label"
              class="ws-seg"
              :class="seg.cls"
              :style="{ width: `${seg.pct}%` }"
              :title="`${seg.label}: ${seg.count}`"
            />
          </div>
          <ul class="ws-legend" aria-label="Project status counts">
            <li v-for="seg in segments(workspaceStats.get(w.id))" :key="seg.label">
              <span class="dot" :class="seg.cls" aria-hidden="true" />
              <span>{{ seg.count }} {{ seg.label }}</span>
            </li>
          </ul>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
/* ---- Hero ---- */
.hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.25rem;
  padding: 1.75rem 1.75rem 1.5rem;
  margin-bottom: 1.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: calc(var(--radius) + 4px);
  box-shadow: var(--shadow-sm);
}

.eyebrow {
  margin: 0 0 0.4rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-primary);
}

.hero-title {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.hero .subtitle {
  max-width: 54ch;
}

.hero-actions {
  display: flex;
  gap: 0.6rem;
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .hero {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* ---- Section titles ---- */
.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.9rem;
  font-size: 1.1rem;
  font-weight: 700;
}

.count-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  height: 1.5rem;
  padding: 0 0.4rem;
  border-radius: 999px;
  background: rgba(79, 70, 229, 0.12);
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 700;
}

/* ---- Workspace grid ---- */
.workspace-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 0.9rem;
}

.workspace-card {
  display: flex;
  gap: 0.9rem;
  padding: 1.1rem;
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}

.workspace-card:hover,
.workspace-card:focus-visible {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
  outline: none;
}

.monogram {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 46px;
  height: 46px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.ws-body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.ws-name {
  margin: 0;
  font-size: 1.02rem;
  font-weight: 700;
}

.ws-desc {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ws-meta {
  margin-top: 0.15rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.ws-count {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-text);
}

.ws-open {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  color: var(--color-text-muted);
  transition: color 0.15s ease, background 0.15s ease;
}

.ws-open svg {
  width: 14px;
  height: 14px;
}

.workspace-card:hover .ws-open,
.workspace-card:focus-visible .ws-open {
  color: #fff;
  background: var(--color-primary);
}

.ws-segments {
  display: flex;
  height: 6px;
  margin-top: 0.55rem;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(107, 114, 128, 0.15);
}

.ws-seg {
  height: 100%;
  transition: width 0.3s ease;
}

.seg-planning {
  background: #2563eb;
}

.seg-progress {
  background: #d97706;
}

.seg-hold {
  background: #6b7280;
}

.seg-completed {
  background: var(--color-success);
}

.ws-legend {
  list-style: none;
  margin: 0.5rem 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem 0.9rem;
}

.ws-legend li {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  color: var(--color-text-muted);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  flex-shrink: 0;
}
</style>