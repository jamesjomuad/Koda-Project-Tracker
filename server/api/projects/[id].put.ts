import { updateProject } from '../../utils/projects.repository';
import { parseProjectPayload } from '../../utils/validation';
import { parseIdParam } from '../../utils/params';

export default defineEventHandler(async (event) => {
  const id = parseIdParam(getRouterParam(event, 'id'));
  const payload = parseProjectPayload(await readBody(event));
  return updateProject(id, payload);
});
