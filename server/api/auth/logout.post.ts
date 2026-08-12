import { defineEventHandler, setResponseStatus } from 'h3';
import { clearSessionCookie } from '../../utils/auth';

export default defineEventHandler((event) => {
  clearSessionCookie(event);
  setResponseStatus(event, 200);
  return { ok: true };
});