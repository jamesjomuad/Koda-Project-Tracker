import { getPrisma } from './db';
import { notFound } from './errors';
import type { Workspace, WorkspacePayload } from '#shared/types/workspace';

const WORKSPACE_SELECT = {
  id: true, name: true, description: true, deletedAt: true, createdAt: true, updatedAt: true,
} as const;

function toWorkspace(row: {
  id: number; name: string; description: string; deletedAt: Date | null;
  createdAt: Date; updatedAt: Date;
}): Workspace {
  return {
    id: row.id,
    name: row.name,
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
  id: number; name: string; description: string; deletedAt: Date | null;
  createdAt: Date; updatedAt: Date;
  _count: { projects: number };
}): WorkspaceListItem {
  return {
    ...toWorkspace(row),
    projectCount: row._count.projects,
  };
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

export async function getWorkspaceById(id: number): Promise<Workspace | null> {
  const workspace = await getPrisma().workspace.findUnique({
    where: { id },
    select: WORKSPACE_SELECT,
  });
  return workspace ? toWorkspace(workspace) : null;
}

export async function createWorkspace(payload: WorkspacePayload): Promise<Workspace> {
  const workspace = await getPrisma().workspace.create({
    data: {
      name: payload.name,
      description: payload.description ?? '',
    },
    select: WORKSPACE_SELECT,
  });
  return toWorkspace(workspace);
}

export async function updateWorkspace(id: number, payload: WorkspacePayload): Promise<Workspace> {
  try {
    const workspace = await getPrisma().workspace.update({
      where: { id },
      data: {
        name: payload.name,
        description: payload.description ?? '',
      },
      select: WORKSPACE_SELECT,
    });
    return toWorkspace(workspace);
  } catch {
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
        data: { name: w.name, description: w.description ?? '' },
      });
    } catch {
      // skip duplicates
    }
  }
  return payloads.length;
}