import { deleteProject } from '../../utils/projects.repository';
import { parseIdParam } from '../../utils/params';

export default defineEventHandler((event) => {
  const id = parseIdParam(getRouterParam(event, 'id'));
  deleteProject(id);
  setResponseStatus(event, 204);
  return null;
});