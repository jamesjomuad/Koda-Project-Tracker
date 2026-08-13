import { deleteProject } from '../../utils/projects.repository';
import { parseIdParam } from '../../utils/params';

export default defineEventHandler(async (event) => {
  const id = parseIdParam(getRouterParam(event, 'id'));
  await deleteProject(id);
  setResponseStatus(event, 204);
  return null;
});
