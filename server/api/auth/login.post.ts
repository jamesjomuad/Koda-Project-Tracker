import { defineEventHandler, readBody, setResponseStatus } from 'h3';
import { badRequest, unauthorized } from '../../utils/errors';
import { verifyCredentials, createSessionToken, setSessionCookie } from '../../utils/auth';

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => null);
  const username = typeof body?.username === 'string' ? body.username.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  const issues: { field: string; message: string }[] = [];
  if (!username) issues.push({ field: 'username', message: 'Username is required' });
  if (!password) issues.push({ field: 'password', message: 'Password is required' });
  if (issues.length) throw badRequest('Invalid login data', issues);

  if (!verifyCredentials(username, password)) {
    throw unauthorized('Incorrect username or password');
  }

  setSessionCookie(event, createSessionToken(username));
  setResponseStatus(event, 200);
  return { user: { username } };
});