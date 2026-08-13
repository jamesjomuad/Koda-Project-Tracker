# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

## [1.1.0] - 2026-08-13

### Added
- Prisma 7 ORM with Users + assignment support (`assignedTo` relation on projects).

### Fixed
- SQLite DB path resolution in production: `DATABASE_URL` is now baked into the Nuxt runtime config and relative `file:` URLs resolve against the project root, so dev and prod builds always point at the same database (`koda/data/projects.db`). Previously prod builds fell back to a stale database, causing P2022 500s on `/api/projects`.
- Footer sticky layout, full-width `ProjectForm` inputs, textarea in the kanban edit modal.

## [1.0.0] - 2026-08-12

### Added
- Client Project Tracker — Nuxt app with SQLite CRUD API and UI.
- Demo auth: login page, HMAC-signed session cookies, protected routes, logout.
- Kanban board with drag-and-drop (`vue-draggable-plus`) and Pinia state management.
- Nuxt UI v4 integration with Tailwind CSS and Lucide icons.
- Dashboard with stats strip and friendly due-date labels.
- Comprehensive README with setup, API docs, and decisions.
- Test suite: API e2e tests (Vitest + Nuxt test utils) and validation unit tests.
- TypeScript strict mode with `nuxt typecheck`.

[Unreleased]: https://github.com/example/koda/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/example/koda/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/example/koda/releases/tag/v1.0.0
