import { listUsers } from '../../utils/users.repository';

export default defineEventHandler(async () => {
  return listUsers();
});
