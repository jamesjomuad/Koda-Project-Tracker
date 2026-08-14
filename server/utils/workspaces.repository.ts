import { getPrisma } from './db';
import { conflict, notFound } from './errors';
import type { H3Error } from 'h3';
import type { Workspace, WorkspacePayload } from '#shared/types/workspace';

const WORKSPACE_SELECT = {
  id: true, name: true, slug: true, description: true, deletedAt: true, createdAt: true, updatedAt: true,
} as const;

function toWorkspace(row: {
  id: number; name: string; slug: string; description: string; deletedAt: Date | null;
  createdAt: Date; updatedAt: Date;
}): Workspace {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export interface WorkspaceListItem extends Workspace {
  projectCount: number;
}

function toWorkspaceListItem(row: {
  id: number; name: string; slug: string; description: string; deletedAt: Date | null;
  createdAt: Date; updatedAt: Date;
  _count: { projects: number };
}): WorkspaceListItem {
  return {
    ...toWorkspace(row),
    projectCount: row._count.projects,
  };
}

function isUniqueError(e: unknown): boolean {
  return typeof e === 'object' && e !== null && (e as { code?: string }).code === 'P2002';
}

function slugConflict(): H3Error {
  return conflict('A workspace with this slug already exists');
}

export async function listWorkspaces(opts: { includeDeleted?: boolean } = {}): Promise<WorkspaceListItem[]> {
  const rows = await getPrisma().workspace.findMany({
    where: opts.includeDeleted ? {} : { deletedAt: null },
    orderBy: { name: 'asc' },
    select: { ...WORKSPACE_SELECT, _count: { select: { projects: true } } },
  });
  return rows.map(toWorkspaceListItem);
}

export async function getWorkspace(id: number): Promise<Workspace> {
  const workspace = await getPrisma().workspace.findFirst({
    where: { id, deletedAt: null },
    select: WORKSPACE_SELECT,
  });
  if (!workspace) throw notFound('Workspace');
  return toWorkspace(workspace);
}

export async function getWorkspaceBySlug(slug: string): Promise<Workspace | null> {
  const workspace = await getPrisma().workspace.findFirst({
    where: { slug, deletedAt: null },
    select: WORKSPACE_SELECT,
  });
  return workspace ? toWorkspace(workspace) : null;
}

export async function getWorkspaceById(id: number): Promise<Workspace | null> {
  const workspace = await getPrisma().workspace.findUnique({
    where: { id },
    select: WORKSPACE_SELECT,
  });
  return workspace ? toWorkspace(workspace) : null;
}

export async function createWorkspace(payload: WorkspacePayload): Promise<Workspace> {
  try {
    const workspace = await getPrisma().workspace.create({
      data: {
        name: payload.name,
        slug: payload.slug,
        description: payload.description ?? '',
      },
      select: WORKSPACE_SELECT,
    });
    return toWorkspace(workspace);
  } catch (e) {
    if (isUniqueError(e)) throw slugConflict();
    throw e;
  }
}

export async function updateWorkspace(id: number, payload: WorkspacePayload): Promise<Workspace> {
  try {
    const workspace = await getPrisma().workspace.update({
      where: { id },
      data: {
        name: payload.name,
        slug: payload.slug,
        description: payload.description ?? '',
      },
      select: WORKSPACE_SELECT,
    });
    return toWorkspace(workspace);
  } catch (e) {
    if (isUniqueError(e)) throw slugConflict();
    throw notFound('Workspace');
  }
}

export async function softDeleteWorkspace(id: number): Promise<void> {
  try {
    await getPrisma().workspace.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  } catch {
    throw notFound('Workspace');
  }
}

export async function restoreWorkspace(id: number): Promise<Workspace> {
  try {
    const workspace = await getPrisma().workspace.update({
      where: { id },
      data: { deletedAt: null },
      select: WORKSPACE_SELECT,
    });
    return toWorkspace(workspace);
  } catch {
    throw notFound('Workspace');
  }
}

export async function countWorkspaces(): Promise<number> {
  return getPrisma().workspace.count({ where: { deletedAt: null } });
}

export async function seedWorkspaces(payloads: WorkspacePayload[]): Promise<number> {
  for (const w of payloads) {
    try {
      await getPrisma().workspace.create({
        data: { name: w.name, slug: w.slug, description: w.description ?? '' },
      });
    } catch {
      // skip duplicates
    }
  }
  return payloads.length;
}