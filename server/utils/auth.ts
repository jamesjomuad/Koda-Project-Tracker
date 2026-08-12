import { createHmac, timingSafeEqual } from 'node:crypto';
import type { H3Event } from 'h3';
import { getCookie, setCookie, deleteCookie } from 'h3';

export interface AuthUser {
  username: string;
}

interface SessionPayload {
  username: string;
  exp: number; // unix seconds
}

export const SESSION_COOKIE = 'koda_session';
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12h
const SECRET = process.env.AUTH_SECRET || 'koda-assessment-dev-secret';
const USERNAME = process.env.AUTH_USERNAME || 'admin';
const PASSWORD = process.env.AUTH_PASSWORD || 'admin123';

function sign(payload: string): string {
  return createHmac('sha256', SECRET).update(payload).digest('base64url');
}

function encode(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${sign(body)}`;
}

function decode(token: string): SessionPayload | null {
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;
  const expected = sign(body);
  const actual = Buffer.from(signature);
  const reference = Buffer.from(expected);
  if (actual.length !== reference.length || !timingSafeEqual(actual, reference)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload;
    if (typeof payload.exp !== 'number' || Date.now() / 1000 >= payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Demo credential check. Usernames/passwords can be overridden via the
 * AUTH_USERNAME / AUTH_PASSWORD environment variables.
 */
export function verifyCredentials(username: string, password: string): boolean {
  return username === USERNAME && password === PASSWORD;
}

export function createSessionToken(username: string): string {
  return encode({ username, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS });
}

export function setSessionCookie(event: H3Event, token: string): void {
  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie(event: H3Event): void {
  deleteCookie(event, SESSION_COOKIE, { path: '/' });
}

export function getSessionUser(event: H3Event): AuthUser | null {
  const token = getCookie(event, SESSION_COOKIE);
  if (!token) return null;
  const payload = decode(token);
  return payload ? { username: payload.username } : null;
}