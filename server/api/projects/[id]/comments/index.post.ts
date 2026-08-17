import { createComment } from '../../../../utils/comments.repository';
import { parseIdParam } from '../../../../utils/params';
import { parseCommentPayload } from '../../../../utils/validation';

export default defineEventHandler(async (event) => {
  const projectId = parseIdParam(getRouterParam(event, 'id'));
  const payload = parseCommentPayload(await readBody(event));
  const comment = await createComment(projectId, payload);
  setResponseStatus(event, 201);
  return comment;
});