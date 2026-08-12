import { defineEventHandler } from 'h3';
import { getSessionUser } from '../../utils/auth';

export default defineEventHandler((event) => {
  const user = getSessionUser(event);
  return { user };
});