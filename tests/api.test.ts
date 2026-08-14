// @vitest-environment node
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { setup } from '@nuxt/test-utils/e2e';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const tempDir = mkdtempSync(path.join(tmpdir(), 'koda-test-'));
const dbPath = path.join(tempDir, 'test.db');
process.env.DATABASE_URL = `file:${dbPath}`;

const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });
await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'member',
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
)`);
await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS workspaces (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  deletedAt TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
)`);
await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clientName TEXT NOT NULL,
  projectName TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('Planning', 'In Progress', 'On Hold', 'Completed')),
  priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High')),
  startDate TEXT NOT NULL,
  dueDate TEXT NOT NULL,
  assignedTo INTEGER REFERENCES users(id) ON DELETE SET NULL,
  workspaceId INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
)`);
await prisma.$disconnect();

await setup({ server: true, port: 3199, build: true });

const base = 'http://127.0.0.1:3199/api/projects';
const workspacesBase = 'http://127.0.0.1:3199/api/workspaces';

const validPayload = {
  clientName: 'Test Co',
  projectName: 'Test Project',
  description: 'Created by tests',
  status: 'Planning' as const,
  priority: 'Low' as const,
  startDate: '2026-01-01',
  dueDate: '2026-02-01',
  workspaceId: 1,
};

async function fetchExpectStatus(pathOrUrl: string, status: number, init?: RequestInit): Promise<any> {
  const res = await fetch(pathOrUrl.startsWith('http') ? pathOrUrl : `${base}${pathOrUrl}`, init);
  expect(res.status).toBe(status);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

describe('GET /api/projects', () => {
  it('returns all seeded projects', async () => {
    const projects = await fetch(`${base}`).then(r => r.json());
    expect(Array.isArray(projects)).toBe(true);
    expect(projects.length).toBeGreaterThan(0);
    expect(projects[0]).toHaveProperty('id');
    expect(projects[0]).toHaveProperty('clientName');
    expect(projects[0]).toHaveProperty('projectName');
    expect(projects[0]).toHaveProperty('status');
    expect(projects[0]).toHaveProperty('priority');
    expect(projects[0]).toHaveProperty('startDate');
    expect(projects[0]).toHaveProperty('dueDate');
    expect(projects[0]).toHaveProperty('workspaceId');
  });

  it('filters by workspaceId', async () => {
    const projects = await fetch(`${base}?workspaceId=2`).then(r => r.json());
    expect(projects.length).toBeGreaterThan(0);
    expect(projects.every((p: any) => p.workspaceId === 2)).toBe(true);
  });

  it('hides projects of soft-deleted workspaces', async () => {
    const res = await fetch(`${workspacesBase}/3`, { method: 'DELETE' });
    expect(res.status).toBe(204);

    const projects = await fetch(`${base}?workspaceId=3`).then(r => r.json());
    expect(projects).toEqual([]);

    const allProjects = await fetch(`${base}`).then(r => r.json());
    expect(allProjects.some((p: any) => p.workspaceId === 3)).toBe(false);

    await fetch(`${workspacesBase}/3/restore`, { method: 'POST' });
  });

  it('filters by status', async () => {
    const projects = await fetch(`${base}?status=Completed`).then(r => r.json());
    expect(projects.every((p: any) => p.status === 'Completed')).toBe(true);
  });

  it('filters by priority', async () => {
    const projects = await fetch(`${base}?priority=High`).then(r => r.json());
    expect(projects.every((p: any) => p.priority === 'High')).toBe(true);
  });

  it('searches across client and project names', async () => {
    const byClient = await fetch(`${base}?search=Acme`).then(r => r.json());
    expect(byClient.some((p: any) => p.clientName.includes('Acme'))).toBe(true);

    const byProject = await fetch(`${base}?search=Ordering`).then(r => r.json());
    expect(byProject.some((p: any) => p.projectName.includes('Ordering'))).toBe(true);
  });

  it('sorts by dueDate ascending by default', async () => {
    const projects = await fetch(`${base}`).then(r => r.json());
    const dates = projects.map((p: any) => p.dueDate);
    expect([...dates].sort()).toEqual(dates);
  });

  it('sorts descending with order=desc', async () => {
    const projects = await fetch(`${base}?sortBy=dueDate&order=desc`).then(r => r.json());
    const dates = projects.map((p: any) => p.dueDate);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it('rejects invalid query parameters', async () => {
    const body = await fetchExpectStatus(`${base}?sortBy=oops`, 400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'sortBy' })]),
    );
  });
});

describe('GET /api/projects/:id', () => {
  it('returns a single project', async () => {
    const project = await fetch(`${base}/1`).then(r => r.json());
    expect(project.id).toBe(1);
  });

  it('returns 404 for a missing project', async () => {
    const body = await fetchExpectStatus(`${base}/99999`, 404);
    expect(body.error).toMatchObject({ code: 'NOT_FOUND', message: 'Project not found' });
  });

  it('returns 400 for a non-numeric id', async () => {
    const body = await fetchExpectStatus(`${base}/abc`, 400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/projects', () => {
  it('creates a project and returns it with 201', async () => {
    const created = await fetchExpectStatus('', 201, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    });
    expect(created).toMatchObject(validPayload);
    expect(created.id).toBeGreaterThan(0);

    const fetched = await fetch(`${base}/${created.id}`).then(r => r.json());
    expect(fetched.projectName).toBe('Test Project');
  });

  it('returns 400 with field issues for an invalid payload', async () => {
    const body = await fetchExpectStatus('', 400, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validPayload, clientName: '', status: 'Bad' }),
    });
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'clientName' })]),
    );
    expect(body.error.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'status' })]),
    );
  });

  it('returns 400 when due date precedes start date', async () => {
    const body = await fetchExpectStatus('', 400, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validPayload, startDate: '2026-05-01', dueDate: '2026-04-01' }),
    });
    expect(body.error.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'dueDate' })]),
    );
  });

  it('returns 404 when the workspace does not exist', async () => {
    const body = await fetchExpectStatus('', 404, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validPayload, workspaceId: 99999 }),
    });
    expect(body.error).toMatchObject({ code: 'NOT_FOUND', message: 'Workspace not found' });
  });
});

describe('PUT /api/projects/:id', () => {
  let createdId: number;

  beforeEach(async () => {
    const created = await fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(validPayload) }).then(r => r.json());
    createdId = created.id;
  });

  it('updates an existing project', async () => {
    const updated = await fetchExpectStatus(`/${createdId}`, 200, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validPayload, projectName: 'Renamed', status: 'Completed', priority: 'High' }),
    });
    expect(updated.projectName).toBe('Renamed');
    expect(updated.status).toBe('Completed');
    expect(updated.priority).toBe('High');
  });

  it('returns 404 when updating a missing project', async () => {
    const body = await fetchExpectStatus('/99999', 404, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    });
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('rejects an invalid update payload', async () => {
    const body = await fetchExpectStatus(`/${createdId}`, 400, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validPayload, projectName: '', priority: 'Nope' }),
    });
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('DELETE /api/projects/:id', () => {
  it('deletes a project', async () => {
    const created = await fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(validPayload) }).then(r => r.json());
    const res = await fetch(`${base}/${created.id}`, { method: 'DELETE' });
    expect(res.status).toBe(204);

    const body = await fetchExpectStatus(`/${created.id}`, 404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns 404 when deleting a missing project', async () => {
    const body = await fetchExpectStatus('/99999', 404, { method: 'DELETE' });
    expect(body.error.code).toBe('NOT_FOUND');
  });
});

describe('GET /api/workspaces', () => {
  it('returns seeded workspaces with project counts', async () => {
    const workspaces = await fetch(workspacesBase).then(r => r.json());
    expect(Array.isArray(workspaces)).toBe(true);
    expect(workspaces.length).toBeGreaterThan(0);
    expect(workspaces[0]).toHaveProperty('id');
    expect(workspaces[0]).toHaveProperty('name');
    expect(workspaces[0]).toHaveProperty('projectCount');
  });

  it('excludes deleted workspaces by default', async () => {
    await fetch(`${workspacesBase}/1`, { method: 'DELETE' });
    const workspaces = await fetch(workspacesBase).then(r => r.json());
    expect(workspaces.some((w: any) => w.id === 1)).toBe(false);
    await fetch(`${workspacesBase}/1/restore`, { method: 'POST' });
  });

  it('includes deleted workspaces with includeDeleted=true', async () => {
    await fetch(`${workspacesBase}/1`, { method: 'DELETE' });
    const workspaces = await fetch(`${workspacesBase}?includeDeleted=true`).then(r => r.json());
    expect(workspaces.some((w: any) => w.id === 1 && w.deletedAt !== null)).toBe(true);
    await fetch(`${workspacesBase}/1/restore`, { method: 'POST' });
  });
});

describe('POST /api/workspaces', () => {
  it('creates a workspace and returns it with 201', async () => {
    const created = await fetch(workspacesBase, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Workspace', description: 'A fresh workspace' }),
    }).then(r => ({ status: r.status, body: r.json() }));
    const body = await created.body;
    expect(created.status).toBe(201);
    expect(body).toMatchObject({ name: 'New Workspace', description: 'A fresh workspace' });
    expect(body.id).toBeGreaterThan(0);
  });

  it('returns 400 with field issues for an invalid payload', async () => {
    const res = await fetch(workspacesBase, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '' }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'name' })]),
    );
  });
});

describe('PUT /api/workspaces/:id', () => {
  it('updates an existing workspace', async () => {
    const updated = await fetch(`${workspacesBase}/2`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Renamed Workspace', description: 'Updated' }),
    });
    expect(updated.status).toBe(200);
    const body = await updated.json();
    expect(body.name).toBe('Renamed Workspace');
    expect(body.description).toBe('Updated');
  });

  it('returns 404 when updating a missing workspace', async () => {
    const res = await fetch(`${workspacesBase}/99999`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Nope' }),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toMatchObject({ code: 'NOT_FOUND', message: 'Workspace not found' });
  });
});

describe('DELETE + restore /api/workspaces/:id', () => {
  it('soft-deletes then restores a workspace', async () => {
    const created = await fetch(workspacesBase, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Temp Workspace' }),
    }).then(r => r.json());

    const project = await fetch(base, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validPayload, workspaceId: created.id }),
    }).then(r => r.json());

    const del = await fetch(`${workspacesBase}/${created.id}`, { method: 'DELETE' });
    expect(del.status).toBe(204);

    const hidden = await fetch(`${base}?workspaceId=${created.id}`).then(r => r.json());
    expect(hidden).toEqual([]);

    const res = await fetch(`${workspacesBase}/${created.id}/restore`, { method: 'POST' });
    expect(res.status).toBe(200);
    const restored = await res.json();
    expect(restored.deletedAt).toBeNull();

    const visible = await fetch(`${base}?workspaceId=${created.id}`).then(r => r.json());
    expect(visible.some((p: any) => p.id === project.id)).toBe(true);
  });

  it('returns 404 when restoring a missing workspace', async () => {
    const res = await fetch(`${workspacesBase}/99999/restore`, { method: 'POST' });
    expect(res.status).toBe(404);
  });
});

afterAll(() => {
  try {
    rmSync(tempDir, { recursive: true, force: true });
  } catch {
    // The test server may still hold the DB file open; best-effort cleanup.
  }
});
