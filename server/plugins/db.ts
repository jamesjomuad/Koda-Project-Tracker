import { getDb } from '../utils/db';
import { countProjects, seedProjects } from '../utils/projects.repository';
import { SEED_PROJECTS } from '#shared/data/seed-data';

export default defineNitroPlugin(() => {
  const db = getDb();
  void db;

  if (countProjects() === 0) {
    const inserted = seedProjects(SEED_PROJECTS);
    console.log(`[db] seeded ${inserted} projects`);
  }
});