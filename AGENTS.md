# AGENTS.md — Koda Client Project Tracker

## Tech Stack

- **Nuxt 4.5.2** (Vue 3.5, TypeScript, server-rendered)
- **Nuxt UI v4.10** — Tailwind CSS v4, Lucide icons (`@iconify-json/lucide`)
- **Prisma 7.9.1** — ORM with `@prisma/adapter-better-sqlite3` driver adapter
- **zod v4** — shared validation (server + client via `#shared` alias)
- **Package manager:** npm
- **Testing:** Vitest (unit + e2e via `@nuxt/test-utils`)
- **vue-draggable-plus** — SortableJS-based, used for kanban DnD
- **Pinia** — project state split across three stores: `app/stores/projects.ts` (projects, loading, error, kanban columns/order), `app/stores/workspaces.ts` (workspaces, activeWorkspaceId, localStorage persistence), `app/stores/users.ts` (users)

## Directory Structure

```
app/                          # Nuxt 4 app directory (frontend)
  assets/css/main.css         # Global styles, CSS custom properties
  components/                 # 10 components (flat, no nesting)
    KanbanBoard.vue           # Horizontal draggable columns wrapper
    KanbanCard.vue            # Project card for kanban (with user avatar)
    KanbanColumn.vue          # Column with draggable cards + quick-add
    ConfirmDialog.vue         # Reusable confirmation modal
    ProjectForm.vue           # Create/edit form with workspace + user dropdowns
    ProjectPriorityBadge.vue  # Color-coded priority badge
    ProjectStatusBadge.vue    # Color-coded status badge
    WorkspaceForm.vue         # Create/edit workspace form (name, slug, description)
    CommentSection.vue        # Project comment thread (list, add, delete)
    WorkspaceNav.vue          # Shared workspace nav (projects/board links)
  composables/                # useAuth.ts, usePersistedRef.ts
  layouts/default.vue         # App shell: header (workspace switcher), nav, footer
  middleware/auth.global.ts   # Route guard — redirects to /login
  pages/
    index.vue                 # Workspace landing — cards link to /{workspace}/projects
    login.vue                 # Login form
    projects/[id].vue         # Project detail — info + comment thread
    projects/new.vue          # Create project form
    projects/[id]/edit.vue    # Edit project form
    workspaces/index.vue      # Workspace management (CRUD, restore, /?new=1 auto-open)
    [workspace]/projects.vue  # Projects dashboard scoped to workspace slug
    [workspace]/kanban.vue    # Kanban board scoped to workspace slug
  stores/
    projects.ts               # Pinia store — projects, loading, error, kanban columns/order
    workspaces.ts             # Pinia store — workspaces, activeWorkspaceId (localStorage)
    users.ts                  # Pinia store — users
  utils/
    api.ts                    # extractApiError / ApiErrorShape shared helper
prisma/
  schema.prisma               # Prisma schema (User + Project models)
  seed.ts                     # Standalone seed script (npx tsx prisma/seed.ts)
server/                       # Nitro backend
  api/auth/                   # login.post, logout.post, session.get
  api/projects/               # Full CRUD: index.get/post, [id].get/put/delete + [id]/comments (list/create/delete)
  api/users/                  # Full CRUD: index.get/post, [id].get/put/delete
  plugins/db.ts               # Auto-seeds users + projects if DB empty
  utils/
    auth.ts                   # HMAC-signed session cookies (12h TTL)
    db.ts                     # Prisma client singleton (PrismaBetterSqlite3)
    error-handler.ts          # Global Nitro error handler (JSON envelope)
    errors.ts                 # Typed error factories (badRequest, notFound, etc.)
    params.ts                 # parseIdParam, coerceQuery helpers
    projects.repository.ts    # Prisma queries — async list, get, create, update, delete
    comments.repository.ts    # Prisma queries — async list, create, delete comments
    users.repository.ts       # Prisma queries — async list, get, create, update, delete
    validation.ts             # Zod schemas for payload + list query
shared/                       # Shared between client & server (#shared alias)
  types/project.ts            # Project, ProjectPayload, enums, sort types
  types/comment.ts            # Comment, CommentPayload
  types/user.ts               # User, UserPayload, UserRole
  data/seed-data.ts           # 12 sample projects for auto-seeding
tests/
  validation.test.ts          # Unit tests for Zod schemas
  api.test.ts                 # E2e tests — full API against temp SQLite DB
```

## Conventions

- **Component organization:** flat `components/` folder, PascalCase filenames, no prefix (auto-imported by Nuxt)
- **Styling:** mix of Nuxt UI components (`UCard`, `UButton`, `UForm`, `UModal`, etc.) + scoped `<style>` with CSS custom properties from `main.css`
- **TypeScript everywhere** — strict mode, `nuxt typecheck` available
- **`#shared` alias** — types and seed data imported as `#shared/types/project` from both client and server
- **Prisma queries are async** — all repository functions return Promises, all API endpoints use `async/await`

## State Management

- **Pinia** — three focused stores: `app/stores/projects.ts` (projects, loading, error, columns, column order), `app/stores/workspaces.ts` (workspaces, activeWorkspaceId persisted to localStorage), `app/stores/users.ts` (users)
- `usePersistedRef()` — composable in `app/composables/usePersistedRef.ts` for localStorage-persisted refs (used for kanban column order + active workspace)
- `extractApiError()` — shared helper in `app/utils/api.ts` (import as `~/utils/api`)
- `useAuth()` — uses `useState('auth.user')` for cross-request state; fetches session from `/api/auth/session` on boot

## Data Layer

- **Prisma 7.9.1** with `@prisma/adapter-better-sqlite3` driver adapter
- **SQLite** database at `data/projects.db`
- **Schema:** `prisma/schema.prisma` with User, Workspace (soft-delete via `deletedAt`), Project, and Comment models (relations: Project.workspaceId → Workspace.id, Project.assignedTo → User.id, Comment.projectId → Project.id with cascade delete)
- **Client singleton:** `server/utils/db.ts` exports `getPrisma()` using `PrismaBetterSqlite3` adapter
- **Repository pattern:** `server/utils/projects.repository.ts` and `server/utils/users.repository.ts` wrap all Prisma queries
- **Auto-seeding:** Nitro plugin seeds 5 users + 12 projects on startup if DB is empty
- **DATABASE_URL env var** — `file:../data/projects.db` (relative to prisma/ dir); overridden in tests
- **Prisma config:** `prisma.config.ts` at project root (URL from `DATABASE_URL` env var, NOT in schema)
- **Generator:** `provider = "prisma-client-js"` (standard, outputs to node_modules)

## Prisma Setup Notes

- Schema uses `provider = "sqlite"` in datasource block — NO `url` field (URL goes in `prisma.config.ts`)
- All timestamps stored as ISO 8601 strings by default via driver adapter
- `PrismaBetterSqlite3` (lowercase 'l') is the correct adapter class name
- `npx prisma generate` must be run after schema changes
- `npx prisma db push --accept-data-loss` to sync schema to DB
- AI detection in Prisma v7: `prisma db push` may block in CI; use `$executeRawUnsafe` in tests instead

## Key Interfaces (`shared/types/project.ts`)

```typescript
type ProjectStatus = 'Planning' | 'In Progress' | 'On Hold' | 'Completed'
type ProjectPriority = 'Low' | 'Medium' | 'High'
type SortField = 'clientName' | 'projectName' | 'status' | 'priority' | 'startDate' | 'dueDate' | 'createdAt'

interface ProjectPayload {
  clientName: string; projectName: string; description?: string;
  status: ProjectStatus; priority: ProjectPriority;
  startDate: string; dueDate: string; assignedTo?: number | null;
}

interface Project extends ProjectPayload {
  id: number; description: string; assignedTo: number | null;
  createdAt: string; updatedAt: string;
}
```

## Known Issues / Rough Edges

- **Prisma deprecation warning** — `@prisma/client` exports field trailing slash pattern in ESM
- **Filter state not in URL** — refreshing the page resets search/filter/sort to defaults
- **Hardcoded demo credentials** — assessment context, not production-ready auth
- **No components.json** — theming via CSS custom properties in `main.css`

## Commands

```bash
npm run dev          # Dev server at http://localhost:3000
npm run build        # Production build to .output/
npm run preview      # Serve production build (after build)
npm run test         # Unit tests + e2e API tests
npm run test:watch   # Vitest in watch mode
npm run typecheck    # TypeScript + Vue type checking
npm run db:push      # Push Prisma schema to SQLite DB
npm run db:seed      # Run seed script (5 users + 12 projects)
npm run db:reset     # Force reset DB + re-seed
```

## Auth Notes

- Demo login: `admin` / `admin123`
- Overridable via env: `AUTH_USERNAME`, `AUTH_PASSWORD`, `AUTH_SECRET`
- Sessions: HMAC-signed httpOnly cookie, 12-hour TTL
- Global middleware (`middleware/auth.global.ts`) redirects to `/login?redirect=...`
