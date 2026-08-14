# Workspaces Feature — Plan

## Summary

Add a `Workspace` entity. A workspace has many projects; every project belongs to exactly one workspace. Workspaces are soft-deleted. A global switcher in the header scopes the Projects dashboard and Kanban board. Existing data is reset & reseeded.

## Decisions (confirmed)

- **Navigation:** Global workspace switcher in the header scopes Projects + Kanban; dedicated `/workspaces` management page.
- **Delete behavior:** Soft delete via `deletedAt` on `Workspace`. Deleting a workspace hides its projects everywhere (join filter `workspace.deletedAt = null`); a restore endpoint brings them back. Projects keep hard delete.
- **Migration:** Reset & reseed (`db:reset`) — demo data is disposable; auto-seed creates workspaces then projects.

## 1. Data Model (`prisma/schema.prisma`)

```prisma
model Workspace {
  id          Int        @id @default(autoincrement())
  name        String
  description String     @default("")
  deletedAt   DateTime?  @map("deletedAt")
  createdAt   DateTime   @default(now()) @map("createdAt")
  updatedAt   DateTime   @updatedAt @map("updatedAt")
  projects    Project[]
  @@map("workspaces")
}
```

`Project` gains:

```prisma
workspaceId Int
workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
```

## 2. Shared Types

- **NEW `shared/types/workspace.ts`** — `WorkspacePayload { name; description? }`, `Workspace extends WorkspacePayload { id; deletedAt: string|null; createdAt; updatedAt }`.
- **`shared/types/project.ts`** — add `workspaceId: number` to `ProjectPayload` and `Project`; add `workspaceId?: number` to `ListProjectsQuery`.

## 3. Server

- **NEW `server/utils/workspaces.repository.ts`** — `listWorkspaces({ includeDeleted })` (with `_count.projects`), `getWorkspace`, `createWorkspace`, `updateWorkspace`, `softDeleteWorkspace`, `restoreWorkspace`, `countWorkspaces`.
- **NEW API routes** `server/api/workspaces/`: `index.get` (list), `index.post` (create), `[id].get`, `[id].put`, `[id].delete` (soft), `[id].restore.ts` (POST restore). Mirrors existing projects/users patterns.
- **`server/utils/validation.ts`**:
  - `workspacePayloadSchema` + `parseWorkspacePayload` (name 1–120 required, description ≤2000 optional).
  - `projectPayloadSchema` gains required `workspaceId: z.number().int().positive()`.
  - `listQuerySchema` gains optional `workspaceId` (coerced int).
- **`server/utils/projects.repository.ts`** — include `workspaceId` in `PROJECT_SELECT`/`toProject`/create/update; always filter `workspace: { deletedAt: null }`; add `where.workspaceId` for list; verify workspace exists & is not deleted on create/update → `notFound('Workspace')`.
- **Seeding** (`shared/data/seed-data.ts`, `server/plugins/db.ts`, `prisma/seed.ts`) — add `SEED_WORKSPACES` (3: Design Studio, Growth & Marketing, Operations); each `SEED_PROJECTS` entry gets `workspaceId` (1–3). Seed workspaces before projects.

## 4. Frontend

- **`app/stores/projects.ts`** — add `workspaces`, `activeWorkspaceId` (persisted to localStorage), `fetchWorkspaces`, `createWorkspace`, `updateWorkspace`, `softDeleteWorkspace`, `restoreWorkspace`, `setActiveWorkspace`. `fetchProjects` sends `workspaceId` when a specific workspace is active.
- **`app/layouts/default.vue`** — global workspace switcher (`USelect`: "All workspaces" + list) in the header + "Workspaces" nav link.
- **NEW `app/pages/workspaces/index.vue`** — management page: list with project counts, create/edit via `UModal`, soft delete via `ConfirmDialog` (warns projects become hidden), restore + "Show deleted" toggle.
- **NEW `app/components/WorkspaceForm.vue`** — create/edit form (follows `ProjectForm` conventions).
- **`app/components/ProjectForm.vue`** — workspace dropdown; create defaults to active workspace.
- **`app/pages/kanban.vue`** — workspace field in the edit modal; quick-add (`handleAdd`) uses active workspace.
- **`app/pages/index.vue`** — subtitle shows active workspace context (minor).

## 5. Tests

- **`tests/validation.test.ts`** — `parseWorkspacePayload`; project payload tests updated to include `workspaceId`; new "workspaceId required/invalid" cases; `parseListQuery` workspaceId coercion.
- **`tests/api.test.ts`** — add `workspaces` table + `workspaceId` FK column to raw SQL; update `validPayload`; new `/api/workspaces` CRUD suite (list, create, update, 404s, soft delete hides workspace + its projects, restore brings back); filter projects by `workspaceId`.

## 6. Execution Steps

1. Update schema → `npx prisma generate`.
2. `npm run db:reset` (reset + reseed with workspaces).
3. Implement shared types → validation → repositories → API routes → seeding.
4. Store → layout switcher → workspaces page/form → ProjectForm/kanban updates.
5. Update tests; run `npm run test` and `npm run typecheck`.

## 7. Suggested Extras (optional)

- Workspace badge on project cards when viewing "All workspaces".
- Color/emoji per workspace for switcher + badges.
- Stats (counts, overdue) per workspace on the management page.