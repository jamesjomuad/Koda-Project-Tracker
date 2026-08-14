import { updateWorkspace } from '../../utils/workspaces.repository';
import { parseWorkspacePayload } from '../../utils/validation';
import { parseIdParam } from '../../utils/params';

export default defineEventHandler(async (event) => {
  const id = parseIdParam(getRouterParam(event, 'id'));
  const payload = parseWorkspacePayload(await readBody(event));
  return updateWorkspace(id, payload);
});