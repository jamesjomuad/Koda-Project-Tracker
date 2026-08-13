import { getPrisma } from './db';
import { notFound } from './errors';
import type { ParsedListQuery } from './validation';
import type { Project, ProjectPayload } from '#shared/types/project';
import type { Prisma } from '@prisma/client';

const PRIORITY_ORDER: Record<string, number> = { Low: 1, Medium: 2, High: 3 };
const STATUS_ORDER: Record<string, number> = { Planning: 1, 'In Progress': 2, 'On Hold': 3, Completed: 4 };

const PROJECT_SELECT = {
  id: true, clientName: true, projectName: true, description: true,
  status: true, priority: true, startDate: true, dueDate: true,
  assignedTo: true, createdAt: true, updatedAt: true,
} as const;

function toProject(row: { id: number; clientName: string; projectName: string; description: string; status: string; priority: string; startDate: string; dueDate: string; assignedTo: number | null; createdAt: Date; updatedAt: Date }): Project {
  return {
    id: row.id,
    clientName: row.clientName,
    projectName: row.projectName,
    description: row.description,
    status: row.status as Project['status'],
    priority: row.priority as Project['priority'],
    startDate: row.startDate,
    dueDate: row.dueDate,
    assignedTo: row.assignedTo,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listProjects(query: ParsedListQuery): Promise<Project[]> {
  const prisma = getPrisma();
  const where: Prisma.ProjectWhereInput = {};

  if (query.status) where.status = query.status;
  if (query.priority) where.priority = query.priority;
  if (query.search) {
    where.OR = [
      { clientName: { contains: query.search } },
      { projectName: { contains: query.search } },
    ];
  }

  const sortField = query.sortBy ?? 'dueDate';
  const orderDirection = query.order === 'desc' ? 'desc' : 'asc';

  let orderBy: Prisma.ProjectOrderByWithRelationInput;
  if (sortField === 'priority') {
    orderBy = { priority: orderDirection };
  } else if (sortField === 'status') {
    orderBy = { status: orderDirection };
  } else {
    orderBy = { [sortField]: orderDirection };
  }

  const rows = await prisma.project.findMany({ where, orderBy, select: PROJECT_SELECT });

  let projects = rows.map(toProject);

  if (sortField === 'priority') {
    projects.sort((a: Project, b: Project) => {
      const cmp = (PRIORITY_ORDER[a.priority] ?? 0) - (PRIORITY_ORDER[b.priority] ?? 0);
      return orderDirection === 'desc' ? -cmp : cmp;
    });
  } else if (sortField === 'status') {
    projects.sort((a: Project, b: Project) => {
      const cmp = (STATUS_ORDER[a.status] ?? 0) - (STATUS_ORDER[b.status] ?? 0);
      return orderDirection === 'desc' ? -cmp : cmp;
    });
  }

  return projects;
}

export async function getProject(id: number): Promise<Project> {
  const prisma = getPrisma();
  const project = await prisma.project.findUnique({ where: { id }, select: PROJECT_SELECT });
  if (!project) throw notFound('Project');
  return toProject(project);
}

export async function createProject(payload: ProjectPayload): Promise<Project> {
  const prisma = getPrisma();
  const project = await prisma.project.create({
    data: {
      clientName: payload.clientName,
      projectName: payload.projectName,
      description: payload.description ?? '',
      status: payload.status,
      priority: payload.priority,
      startDate: payload.startDate,
      dueDate: payload.dueDate,
      assignedTo: payload.assignedTo ?? null,
    },
    select: PROJECT_SELECT,
  });
  return toProject(project);
}

export async function updateProject(id: number, payload: ProjectPayload): Promise<Project> {
  const prisma = getPrisma();
  try {
    const project = await prisma.project.update({
      where: { id },
      data: {
        clientName: payload.clientName,
        projectName: payload.projectName,
        description: payload.description ?? '',
        status: payload.status,
        priority: payload.priority,
        startDate: payload.startDate,
        dueDate: payload.dueDate,
        assignedTo: payload.assignedTo ?? null,
      },
      select: PROJECT_SELECT,
    });
    return toProject(project);
  } catch {
    throw notFound('Project');
  }
}

export async function deleteProject(id: number): Promise<void> {
  const prisma = getPrisma();
  try {
    await prisma.project.delete({ where: { id } });
  } catch {
    throw notFound('Project');
  }
}

export async function countProjects(): Promise<number> {
  return getPrisma().project.count();
}

export async function seedProjects(payloads: ProjectPayload[]): Promise<number> {
  const prisma = getPrisma();
  for (const p of payloads) {
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
      },
    });
  }
  return payloads.length;
}
