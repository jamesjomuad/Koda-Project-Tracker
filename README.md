# Koda Client Project Tracker

A full-stack client project tracker for a digital agency. Project managers can create, view, update, and delete client projects, track their progress, and filter, search, and sort the list.

Built as a Full Stack Developer technical assessment (see `docs/REQUIREMENTS.md`).

## Features

- **CRUD projects** — create, list, view, update, and delete client projects
- **Rich list** — search by client/project name, filter by status and priority, sort by any field (ascending/descending)
- **Validation** — required fields, valid status/priority enums, real calendar dates, `dueDate` cannot be before `startDate`, with field-level error messages
- **Seed data** — the database is auto-seeded with 12 sample projects on first run
- **Authentication** — demo username/password login (session cookie), protected routes, logout
- **Meaningful errors** — a consistent JSON error envelope (`code`, `message`, `issues`) for all API errors
- **Responsive UI** — project cards with status/priority badges, overdue highlighting, confirm-before-delete dialog, loading/empty/error states

## Tech Stack

| Layer    | Choice                                                          |
| -------- | --------------------------------------------------------------- |
| Frontend | Nuxt 4 (Vue 3, TypeScript), server-rendered pages               |
| Backend  | Nitro server routes (REST API) with h3                           |
| Validation | zod v4 (shared between server and client)                      |
| Database | SQLite via better-sqlite3 (single-file, zero-setup)              |
| Tests    | Vitest — unit tests + end-to-end API tests (`@nuxt/test-utils`) |

## Getting Started

Requirements: Node.js **20+** (developed on Node 24) and npm.

```bash
npm install      # installs dependencies and runs `nuxt prepare`
npm run dev      # start the dev server at http://localhost:3000
```

The SQLite database is created automatically at `data/projects.db` and seeded with sample projects on first boot. Set `DB_PATH` to use a different database file/location.

### Demo login

Sign in at the login screen:

| Field    | Value       |
| -------- | ----------- |
| Username | `admin`     |
| Password | `admin123`  |

Credentials and the cookie-signing secret can be overridden for deployments via `AUTH_USERNAME`, `AUTH_PASSWORD`, and `AUTH_SECRET` environment variables. Sessions are signed 12-hour httpOnly cookies.

### Other scripts

```bash
npm run build       # production build to .output/
npm run preview     # serve the production build (after build)
npm run test        # unit tests + end-to-end API tests
npm run typecheck   # TypeScript + Vue type checking
```

## Project Structure

```
app/                        # Nuxt app (frontend)
  assets/css/main.css       #   global styles / design tokens
  components/               #   ProjectForm, badges, ConfirmDialog, ...
  composables/              #   useProjects, useAuth (client API access)
  layouts/default.vue       #   app shell (header, nav, footer, logout)
  middleware/auth.global.ts #   route guard (redirects to /login)
  pages/                    #   /, /login, /projects/new, /projects/:id/edit
server/                     # Nitro server (backend)
  api/projects/             #   REST routes: index.get/post, [id].get/put/delete
  api/auth/                 #   login.post, logout.post, session.get
  plugins/db.ts             #   opens DB + seeds on startup
  utils/                    #   db, repository, validation, errors, params, auth, error-handler
shared/                     # types + seed data shared by server and client (#shared alias)
tests/                      # Vitest unit + e2e tests
docs/                       # original assessment documents
```

## REST API

### Authentication

| Method | Path                | Description                       | Success |
| ------ | ------------------- | --------------------------------- | ------- |
| POST   | `/api/auth/login`   | Sign in with username/password    | 200     |
| POST   | `/api/auth/logout`  | Clear the session cookie          | 200     |
| GET    | `/api/auth/session` | Get the current user (or `null`)  | 200     |

### Projects

Base path: `/api/projects`

| Method | Path            | Description                      | Success |
| ------ | --------------- | -------------------------------- | ------- |
| GET    | `/api/projects`       | List projects (with filters)     | 200     |
| GET    | `/api/projects/:id`   | Get a single project             | 200     |
| POST   | `/api/projects`       | Create a project                 | 201     |
| PUT    | `/api/projects/:id`   | Update a project                 | 200     |
| DELETE | `/api/projects/:id`   | Delete a project                 | 204     |

Query parameters for the list endpoint: `search`, `status`, `priority`, `sortBy` (one of `clientName`, `projectName`, `status`, `priority`, `startDate`, `dueDate`), `order` (`asc` | `desc`).

### Project shape

```json
{
  "id": 1,
  "clientName": "Acme Corporation",
  "projectName": "Corporate Website Redesign",
  "description": "Redesign and modernize the company's corporate website.",
  "status": "In Progress",
  "priority": "High",
  "startDate": "2026-06-01",
  "dueDate": "2026-07-15",
  "createdAt": "2026-08-12 01:50:30",
  "updatedAt": "2026-08-12 01:50:30"
}
```

### Error envelope

All errors follow one shape, making client handling predictable:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid project data",
    "issues": [{ "field": "dueDate", "message": "Due date cannot be earlier than start date" }]
  }
}
```

## Technical Decisions

- **Nuxt 4 monorepo-style layout** — `app/`, `server/`, and `shared/` at the root. `shared/` is aliased as `#shared` so the same TypeScript types and seed data are used by both the client and the server, eliminating drift.
- **SQLite + better-sqlite3** — a single-file database keeps setup trivial (no external service). `better-sqlite3` was chosen over Node's experimental `node:sqlite` to avoid `ExperimentalWarning` noise. A thin repository layer (`server/utils/projects.repository.ts`) keeps SQL out of the route handlers.
- **zod validation** — one schema (`server/utils/validation.ts`) validates create/update payloads and query strings, producing field-level issues that are surfaced both in the API and in the UI form.
- **Consistent error handling** — a global Nitro error handler returns the JSON envelope for `/api/*` routes while delegating page errors to Nuxt's default handler (so `app/error.vue` renders normally).
- **Stateless session auth** — the login endpoint signs a username + expiry into an HMAC token (`node:crypto`) stored in an httpOnly, SameSite cookie. No session table is needed, and `getSessionUser()` just verifies the signature on each request. The Nuxt app's global middleware redirects unauthenticated users to `/login`. Credentials and the signing secret come from environment variables with assessment-friendly demo defaults.
- **TypeScript everywhere** — shared types, `strict` settings, and `nuxt typecheck` (vue-tsc) as a CI-friendly guard.
- **Two-tier testing** — pure unit tests for the validation logic plus end-to-end API tests that boot a real Nitro server against a temp SQLite DB (see `vitest.config.ts` / `vitest.e2e.config.ts`).

## AI Tool Disclosure

This solution was developed with the assistance of AI tools (Claude — "opencode"). AI was used to scaffold the project, generate and review code, and iterate on the test suite. All technical decisions were reviewed and verified by the author (build, typecheck, and test results confirmed before committing).

## License

Original assessment content in `docs/` © the issuing company. This implementation is provided for evaluation purposes.
