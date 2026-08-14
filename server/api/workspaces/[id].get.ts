import { getWorkspace } from '../../utils/workspaces.repository';
import { parseIdParam } from '../../utils/params';

export default defineEventHandler(async (event) => {
  const id = parseIdParam(getRouterParam(event, 'id'));
  return getWorkspace(id);
});