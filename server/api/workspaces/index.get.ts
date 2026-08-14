import { listWorkspaces } from '../../utils/workspaces.repository';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const includeDeleted = query.includeDeleted === 'true' || query.includeDeleted === '1';
  return listWorkspaces({ includeDeleted });
});