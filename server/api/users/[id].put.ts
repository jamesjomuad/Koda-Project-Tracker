import { updateUser } from '../../utils/users.repository';

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'));
  const body = await readBody(event);
  return updateUser(id, body);
});
