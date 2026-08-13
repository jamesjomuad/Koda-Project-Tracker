import { createProject } from '../../utils/projects.repository';
import { parseProjectPayload } from '../../utils/validation';

export default defineEventHandler(async (event) => {
  const payload = parseProjectPayload(await readBody(event));
  const project = await createProject(payload);
  setResponseStatus(event, 201);
  return project;
});
