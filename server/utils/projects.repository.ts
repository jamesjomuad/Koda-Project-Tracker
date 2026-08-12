import { getDb } from './db';
import { notFound } from './errors';
import type { ParsedListQuery } from './validation';
import type { Project, ProjectPayload } from '#shared/types/project';

const PRIORITY_CASE = `CASE priority WHEN 'Low' THEN 1 WHEN 'Medium' THEN 2 WHEN 'High' THEN 3 END`;
const STATUS_CASE = `CASE status WHEN 'Planning' THEN 1 WHEN 'In Progress' THEN 2 WHEN 'On Hold' THEN 3 WHEN 'Completed' THEN 4 END`;

const SELECT_COLUMNS = 'id, clientName, projectName, description, status, priority, startDate, dueDate, createdAt, updatedAt';

export function listProjects(query: ParsedListQuery): Project[] {
  const db = getDb();
  const where: string[] = [];
  const params: unknown[] = [];

  if (query.status) {
    where.push('status = ?');
    params.push(query.status);
  }
  if (query.priority) {
    where.push('priority = ?');
    params.push(query.priority);
  }
  if (query.search) {
    const term = `%${query.search}%`;
    where.push('(clientName LIKE ? OR projectName LIKE ?)');
    params.push(term, term);
  }

  const sortExpression: Record<string, string> = {
    priority: PRIORITY_CASE,
    status: STATUS_CASE,
    clientName: 'clientName',
    projectName: 'projectName',
    startDate: 'startDate',
    dueDate: 'dueDate',
    createdAt: 'createdAt',
  };

  const orderDirection = query.order === 'desc' ? 'DESC' : 'ASC';
  const orderBy = `${sortExpression[query.sortBy] ?? 'dueDate'} ${orderDirection}`;

  const sql = `
    SELECT ${SELECT_COLUMNS}
    FROM projects
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY ${orderBy}, id ASC
  `;

  return db.prepare(sql).all(...params) as Project[];
}

export function getProject(id: number): Project {
  const db = getDb();
  const project = db.prepare(`SELECT ${SELECT_COLUMNS} FROM projects WHERE id = ?`).get(id) as Project | undefined;
  if (!project) throw notFound('Project');
  return project;
}

export function createProject(payload: ProjectPayload): Project {
  const db = getDb();
  const result = db
    .prepare(
      'INSERT INTO projects (clientName, projectName, description, status, priority, startDate, dueDate) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
    .run(payload.clientName, payload.projectName, payload.description ?? '', payload.status, payload.priority, payload.startDate, payload.dueDate);
  return getProject(Number(result.lastInsertRowid));
}

export function updateProject(id: number, payload: ProjectPayload): Project {
  const db = getDb();
  const result = db
    .prepare(
      `UPDATE projects
       SET clientName = ?, projectName = ?, description = ?, status = ?, priority = ?, startDate = ?, dueDate = ?, updatedAt = datetime('now')
       WHERE id = ?`,
    )
    .run(payload.clientName, payload.projectName, payload.description ?? '', payload.status, payload.priority, payload.startDate, payload.dueDate, id);

  if (result.changes === 0) throw notFound('Project');
  return getProject(id);
}

export function deleteProject(id: number): void {
  const db = getDb();
  const result = db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  if (result.changes === 0) throw notFound('Project');
}

export function countProjects(): number {
  return Number(getDb().prepare('SELECT COUNT(*) AS count FROM projects').get()!.count);
}

export function seedProjects(payloads: ProjectPayload[]): number {
  const db = getDb();
  const insert = db.prepare(
    'INSERT INTO projects (clientName, projectName, description, status, priority, startDate, dueDate) VALUES (?, ?, ?, ?, ?, ?, ?)',
  );
  const insertMany = db.transaction((rows: ProjectPayload[]) => {
    for (const row of rows) {
      insert.run(row.clientName, row.projectName, row.description ?? '', row.status, row.priority, row.startDate, row.dueDate);
    }
  });
  insertMany(payloads);
  return payloads.length;
}