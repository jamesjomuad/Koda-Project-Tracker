import { deleteUser } from '../../utils/users.repository';

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'));
  await deleteUser(id);
  return { ok: true };
});
