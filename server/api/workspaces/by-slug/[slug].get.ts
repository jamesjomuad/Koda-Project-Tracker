import { getRouterParam } from 'h3';
import { getWorkspaceBySlug } from '../../../utils/workspaces.repository';
import { notFound } from '../../../utils/errors';

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug');
  if (!slug) throw notFound('Workspace');
  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) throw notFound('Workspace');
  return workspace;
});