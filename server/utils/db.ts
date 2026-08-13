import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'node:path';

let prisma: PrismaClient | undefined;

function resolveDbUrl(): string {
  const fromEnv = process.env.DATABASE_URL;
  if (fromEnv) return fromEnv;
  return `file:${path.join(process.cwd(), 'data', 'projects.db')}`;
}

export function getPrisma(): PrismaClient {
  if (!prisma) {
    const adapter = new PrismaBetterSqlite3({ url: resolveDbUrl() });
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}
