import { getProject } from '../../utils/projects.repository';
import { parseIdParam } from '../../utils/params';

export default defineEventHandler(async (event) => {
  const id = parseIdParam(getRouterParam(event, 'id'));
  return getProject(id);
});
