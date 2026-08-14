import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEED_PROJECTS, SEED_WORKSPACES } from '../shared/data/seed-data';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_URL ?? `file:${path.resolve(__dirname, '..', 'data', 'projects.db')}`;

const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

const SEED_USERS = [
  { name: 'Alice Johnson', email: 'alice@example.com', role: 'admin' },
  { name: 'Bob Smith', email: 'bob@example.com', role: 'member' },
  { name: 'Carol Davis', email: 'carol@example.com', role: 'member' },
  { name: 'David Lee', email: 'david@example.com', role: 'member' },
  { name: 'Eva Martinez', email: 'eva@example.com', role: 'member' },
];

async function main() {
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    for (const user of SEED_USERS) {
      await prisma.user.create({ data: user });
    }
    console.log(`[seed] created ${SEED_USERS.length} users`);
  }

  const workspaceCount = await prisma.workspace.count();
  if (workspaceCount === 0) {
    for (const w of SEED_WORKSPACES) {
      await prisma.workspace.create({
        data: { name: w.name, slug: w.slug, description: w.description ?? '' },
      });
    }
    console.log(`[seed] created ${SEED_WORKSPACES.length} workspaces`);
  }

  const projectCount = await prisma.project.count();
  if (projectCount === 0) {
    for (const p of SEED_PROJECTS) {
      await prisma.project.create({
        data: {
          clientName: p.clientName,
          projectName: p.projectName,
          description: p.description ?? '',
          status: p.status,
          priority: p.priority,
          startDate: p.startDate,
          dueDate: p.dueDate,
          assignedTo: p.assignedTo ?? null,
          workspaceId: p.workspaceId,
        },
      });
    }
    console.log(`[seed] created ${SEED_PROJECTS.length} projects`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
