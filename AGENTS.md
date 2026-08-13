# AGENTS.md — Koda Client Project Tracker

## Tech Stack

- **Nuxt 4.5.2** (Vue 3.5, TypeScript, server-rendered)
- **Nuxt UI v4.10** — Tailwind CSS v4, Lucide icons (`@iconify-json/lucide`)
- **better-sqlite3** — local SQLite DB at `data/projects.db`
- **zod v4** — shared validation (server + client via `#shared` alias)
- **Package manager:** npm
- **Testing:** Vitest (unit + e2e via `@nuxt/test-utils`)
- **vue-draggable-plus** — SortableJS-based, used for kanban DnD
- **Pinia** — project state management (`app/stores/projects.ts`)
- **No external database**

## Directory Structure

```
app/                          # Nuxt 4 app directory (frontend)
  assets/css/main.css         # Global styles, CSS custom properties
  components/                 # 8 components (flat, no nesting)
  composables/                # useAuth.ts
  layouts/default.vue         # App shell: header, nav, footer
  middleware/auth.global.ts   # Route guard — redirects to /login
  pages/
    index.vue                 # Dashboard — project list with search/filter/sort
    kanban.vue                # Kanban board view
    login.vue                 # Login form
    projects/new.vue          # Create project form
    projects/[id]/edit.vue    # Edit project form
  stores/
    projects.ts               # Pinia store — all project + kanban state
server/                       # Nitro backend
  api/auth/                   # login.post, logout.post, session.get
  api/projects/               # Full CRUD: index.get/post, [id].get/put/delete
  plugins/db.ts               # Opens DB, auto-seeds if empty
  utils/
    auth.ts                   # HMAC-signed session cookies (12h TTL)
    db.ts                     # SQLite connection, schema DDL
    error-handler.ts          # Global Nitro error handler (JSON envelope)
    errors.ts                 # Typed error factories (badRequest, notFound, etc.)
    params.ts                 # parseIdParam, coerceQuery helpers
    projects.repository.ts    # SQL queries — list, get, create, update, delete, seed
    validation.ts             # Zod schemas for payload + list query
shared/                       # Shared between client & server (#shared alias)
  types/project.ts            # Project, ProjectPayload, enums, sort types
  data/seed-data.ts           # 12 sample projects for auto-seeding
tests/
  validation.test.ts          # Unit tests for Zod schemas
  api.test.ts                 # E2e tests — full API against temp SQLite DB
```

## Conventions

- **Component organization:** flat `components/` folder, PascalCase filenames, no prefix (auto-imported by Nuxt)
- **Naming:** `ProjectForm.vue`, `ProjectStatusBadge.vue`, `ConfirmDialog.vue`, `KanbanCard.vue`, `KanbanColumn.vue`, `KanbanBoard.vue`
- **Styling:** mix of Nuxt UI components (`UCard`, `UButton`, `UForm`, `UModal`, etc.) + scoped `<style>` with CSS custom properties from `main.css`
- **No atomic design** — simple feature-oriented flat structure
- **TypeScript everywhere** — strict mode, `nuxt typecheck` available
- **`#shared` alias** — types and seed data imported as `#shared/types/project` from both client and server

## State Management

- **Pinia** — `app/stores/projects.ts` holds all project + kanban state (projects list, loading, error, columns, column order)
- `useAuth()` — uses `useState('auth.user')` for cross-request state; fetches session from `/api/auth/session` on boot
- `useProjects()` removed — replaced by `useProjectsStore()` from Pinia
- **No URL query param sync** — filter/sort state lives in local refs in `index.vue`. A debounced `watch` triggers `fetchProjects()` on change. State is not persisted to the URL.

## Key Features Status

| Feature | Status | Notes |
|---------|--------|-------|
| Project CRUD | Done | Full create/read/update/delete with validation |
| List with search/filter/sort | Done | Debounced search, status/priority filters, multi-field sort |
| Dashboard stats | Done | Total, in-progress, completed, overdue counts |
| Authentication | Done | HMAC cookie session, global middleware, demo credentials (admin/admin123) |
| Validation | Done | Zod schemas with field-level errors, shared client/server |
| Error handling | Done | Global Nitro handler, JSON envelope, client-side `extractApiError()` |
| Seed data | Done | 12 projects auto-seeded on first run |
| Tests | Done | Unit (validation) + e2e (full API) |
| **Kanban board** | Done | 4 columns by status, DnD card reorder, inline add/edit/delete, column reorder via localStorage |
| **Pinia store** | Done | Centralized project + kanban state in `app/stores/projects.ts` |
| **URL query sync** | Not present | Filters are local refs only |

## Data Layer

- **SQLite** via `better-sqlite3` — file at `data/projects.db`
- **Schema:** single `projects` table (id, clientName, projectName, description, status, priority, startDate, dueDate, createdAt, updatedAt)
- **Repository pattern:** `server/utils/projects.repository.ts` wraps all SQL
- **Auto-seeding:** Nitro plugin seeds 12 projects from `shared/data/seed-data.ts` on startup if DB is empty
- **DB_PATH env var** overrides the default file path (used in tests for temp DB)

## Key Interfaces (`shared/types/project.ts`)

```typescript
type ProjectStatus = 'Planning' | 'In Progress' | 'On Hold' | 'Completed'
type ProjectPriority = 'Low' | 'Medium' | 'High'
type SortField = 'clientName' | 'projectName' | 'status' | 'priority' | 'startDate' | 'dueDate' | 'createdAt'

interface ProjectPayload {
  clientName: string; projectName: string; description?: string;
  status: ProjectStatus; priority: ProjectPriority;
  startDate: string; dueDate: string;
}

interface Project extends ProjectPayload {
  id: number; description: string; createdAt: string; updatedAt: string;
}
```

## Known Issues / Rough Edges

- **console.log in db plugin** (`server/plugins/db.ts:11`) — seed log left in production code
- **console.error in error-handler** (`server/utils/error-handler.ts:27`) — expected for server errors, but no logging abstraction
- **No TODO/FIXME comments** — codebase is clean
- **Filter state not in URL** — refreshing the page resets search/filter/sort to defaults
- **No Pinia** — if state management grows (kanban, multi-entity), will need introduction
- **No components.json** — Nuxt UI is not configured with a custom theme file; theming is via CSS custom properties in `main.css`
- **Hardcoded demo credentials** — assessment context, not production-ready auth

## Commands

```bash
npm run dev          # Dev server at http://localhost:3000
npm run build        # Production build to .output/
npm run preview      # Serve production build (after build)
npm run test         # Unit tests + e2e API tests
npm run test:watch   # Vitest in watch mode
npm run typecheck    # TypeScript + Vue type checking
```

## Auth Notes

- Demo login: `admin` / `admin123`
- Overridable via env: `AUTH_USERNAME`, `AUTH_PASSWORD`, `AUTH_SECRET`
- Sessions: HMAC-signed httpOnly cookie, 12-hour TTL
- Global middleware (`middleware/auth.global.ts`) redirects to `/login?redirect=...`
