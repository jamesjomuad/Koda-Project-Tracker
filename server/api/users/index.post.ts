import { createUser } from '../../utils/users.repository';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  return createUser(body);
});
