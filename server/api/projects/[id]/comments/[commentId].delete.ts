import { deleteComment } from '../../../../utils/comments.repository';
import { parseIdParam } from '../../../../utils/params';

export default defineEventHandler(async (event) => {
  const commentId = parseIdParam(getRouterParam(event, 'commentId'));
  await deleteComment(commentId);
  setResponseStatus(event, 204);
  return null;
});