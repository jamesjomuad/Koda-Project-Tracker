import { getPrisma } from './db';
import { notFound } from './errors';
import { getProject } from './projects.repository';
import type { Comment, CommentPayload } from '#shared/types/comment';

const COMMENT_SELECT = {
  id: true, body: true, projectId: true, createdAt: true, updatedAt: true,
} as const;

function toComment(row: { id: number; body: string; projectId: number; createdAt: Date; updatedAt: Date }): Comment {
  return {
    id: row.id,
    body: row.body,
    projectId: row.projectId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function assertActiveProject(projectId: number): Promise<void> {
  await getProject(projectId);
}

export async function listComments(projectId: number): Promise<Comment[]> {
  await assertActiveProject(projectId);
  const rows = await getPrisma().comment.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
    select: COMMENT_SELECT,
  });
  return rows.map(toComment);
}

export async function createComment(projectId: number, payload: CommentPayload): Promise<Comment> {
  await assertActiveProject(projectId);
  const comment = await getPrisma().comment.create({
    data: { body: payload.body, projectId },
    select: COMMENT_SELECT,
  });
  return toComment(comment);
}

export async function deleteComment(id: number): Promise<void> {
  try {
    await getPrisma().comment.delete({ where: { id } });
  } catch {
    throw notFound('Comment');
  }
}