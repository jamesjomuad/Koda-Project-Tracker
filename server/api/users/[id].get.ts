import { getUser } from '../../utils/users.repository';

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'));
  return getUser(id);
});
