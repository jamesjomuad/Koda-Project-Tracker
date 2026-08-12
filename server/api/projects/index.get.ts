import { listProjects } from '../../utils/projects.repository';
import { parseListQuery } from '../../utils/validation';
import { coerceQuery } from '../../utils/params';

export default defineEventHandler((event) => {
  const parsed = parseListQuery(coerceQuery(getQuery(event)));
  return listProjects(parsed);
});