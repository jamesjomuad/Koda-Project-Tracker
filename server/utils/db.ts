import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'node:path';

let prisma: PrismaClient | undefined;

function resolveDbUrl(): string {
  const raw = process.env.DATABASE_URL ?? useRuntimeConfig().databaseUrl;
  if (raw) {
    const filePath = raw.replace(/^file:/i, '');
    if (path.isAbsolute(filePath)) return `file:${filePath}`;
    return `file:${path.resolve(process.cwd(), filePath)}`;
  }
  return `file:${path.join(process.cwd(), 'data', 'projects.db')}`;
}

export function getPrisma(): PrismaClient {
  if (!prisma) {
    const adapter = new PrismaBetterSqlite3({ url: resolveDbUrl() });
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}
