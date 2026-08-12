import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { setup, $fetch } from '@nuxt/test-utils/e2e';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const tempDir = mkdtempSync(path.join(tmpdir(), 'koda-test-'));
process.env.DB_PATH = path.join(tempDir, 'test.db');

await setup({ server: true, port: 3199, host: '127.0.0.1' });

const base = 'http://127.0.0.1:3199/api/projects';

const validPayload = {
  clientName: 'Test Co',
  projectName: 'Test Project',
  description: 'Created by tests',
  status: 'Planning' as const,
  priority: 'Low' as const,
  startDate: '2026-01-01',
  dueDate: '2026-02-01',
};

async function fetchExpectStatus(pathOrUrl: string, status: number, init?: RequestInit): Promise<any> {
  const res = await fetch(pathOrUrl.startsWith('http') ? pathOrUrl : `${base}${pathOrUrl}`, init);
  expect(res.status).toBe(status);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

describe('GET /api/projects', () => {
  it('returns all seeded projects', async () => {
    const projects = await $fetch(`${base}`);
    expect(Array.isArray(projects)).toBe(true);
    expect(projects.length).toBeGreaterThan(0);
    expect(projects[0]).toHaveProperty('id');
    expect(projects[0]).toHaveProperty('clientName');
    expect(projects[0]).toHaveProperty('projectName');
    expect(projects[0]).toHaveProperty('status');
    expect(projects[0]).toHaveProperty('priority');
    expect(projects[0]).toHaveProperty('startDate');
    expect(projects[0]).toHaveProperty('dueDate');
  });

  it('filters by status', async () => {
    const projects = await $fetch(`${base}?status=Completed`);
    expect(projects.every((p: any) => p.status === 'Completed')).toBe(true);
  });

  it('filters by priority', async () => {
    const projects = await $fetch(`${base}?priority=High`);
    expect(projects.every((p: any) => p.priority === 'High')).toBe(true);
  });

  it('searches across client and project names', async () => {
    const byClient = await $fetch(`${base}?search=Acme`);
    expect(byClient.some((p: any) => p.clientName.includes('Acme'))).toBe(true);

    const byProject = await $fetch(`${base}?search=Ordering`);
    expect(byProject.some((p: any) => p.projectName.includes('Ordering'))).toBe(true);
  });

  it('sorts by dueDate ascending by default', async () => {
    const projects = await $fetch(`${base}`);
    const dates = projects.map((p: any) => p.dueDate);
    expect([...dates].sort()).toEqual(dates);
  });

  it('sorts descending with order=desc', async () => {
    const projects = await $fetch(`${base}?sortBy=dueDate&order=desc`);
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
    const project = await $fetch(`${base}/1`);
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

    const fetched = await $fetch(`${base}/${created.id}`);
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
});

describe('PUT /api/projects/:id', () => {
  let createdId: number;

  beforeEach(async () => {
    const created = await $fetch(base, { method: 'POST', body: validPayload });
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
    const created = await $fetch(base, { method: 'POST', body: validPayload });
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

afterAll(() => {
  rmSync(tempDir, { recursive: true, force: true });
});