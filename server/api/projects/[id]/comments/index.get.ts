import { listComments } from '../../../../utils/comments.repository';
import { parseIdParam } from '../../../../utils/params';

export default defineEventHandler(async (event) => {
  const projectId = parseIdParam(getRouterParam(event, 'id'));
  return listComments(projectId);
});