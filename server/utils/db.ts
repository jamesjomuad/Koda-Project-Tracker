import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS projects (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    clientName  TEXT NOT NULL,
    projectName TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status      TEXT NOT NULL CHECK (status IN ('Planning', 'In Progress', 'On Hold', 'Completed')),
    priority    TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High')),
    startDate   TEXT NOT NULL,
    dueDate     TEXT NOT NULL,
    createdAt   TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt   TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

let instance: Database.Database | undefined;

/** Opens a fresh, schema-initialized database (file path or ':memory:'). */
export function createDatabase(dbPath: string): Database.Database {
  if (dbPath !== ':memory:') {
    mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  return db;
}

/** Resolve the SQLite file path. Overridable via DB_PATH for tests/Docker. */
export function resolveDbPath(): string {
  const fromEnv = process.env.DB_PATH;
  if (fromEnv) return fromEnv;
  return path.join(process.cwd(), 'data', 'projects.db');
}

/** Opens the process-wide shared connection. */
export function getDb(): Database.Database {
  if (!instance) {
    instance = createDatabase(resolveDbPath());
  }
  return instance;
}

/** Test helper: swap in a fresh connection. */
export function setDb(db: Database.Database): void {
  instance = db;
}