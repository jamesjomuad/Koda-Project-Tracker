import { createWorkspace } from '../../utils/workspaces.repository';
import { parseWorkspacePayload } from '../../utils/validation';

export default defineEventHandler(async (event) => {
  const payload = parseWorkspacePayload(await readBody(event));
  const workspace = await createWorkspace(payload);
  setResponseStatus(event, 201);
  return workspace;
});