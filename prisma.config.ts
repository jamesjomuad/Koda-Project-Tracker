import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "prisma/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

function resolveDbUrl(): string {
  const raw = process.env["DATABASE_URL"] ?? "file:data/projects.db";
  const filePath = raw.replace(/^file:/i, "");
  if (path.isAbsolute(filePath)) return `file:${filePath}`;
  return `file:${path.resolve(rootDir, filePath)}`;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: resolveDbUrl(),
  },
});
