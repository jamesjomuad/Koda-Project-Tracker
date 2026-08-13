import { getPrisma } from '../utils/db';
import { countProjects, seedProjects } from '../utils/projects.repository';
import { countUsers, seedUsers } from '../utils/users.repository';
import { SEED_PROJECTS } from '#shared/data/seed-data';

export default defineNitroPlugin(async () => {
  const prisma = getPrisma();
  void prisma;

  if ((await countUsers()) === 0) {
    const inserted = await seedUsers();
    console.log(`[db] seeded ${inserted} users`);
  }

  if ((await countProjects()) === 0) {
    const inserted = await seedProjects(SEED_PROJECTS);
    console.log(`[db] seeded ${inserted} projects`);
  }
});
