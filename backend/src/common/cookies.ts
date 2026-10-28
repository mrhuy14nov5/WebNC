import { randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';

export const sessionCookieName = 'unimanage_session';
export const csrfCookieName = 'unimanage_csrf';
const sessionLifetimeSeconds = 7 * 24 * 60 * 60;

export function readCookie(request: Request, name: string) {
  const cookies = request.headers.cookie?.split(';') ?? [];
  const cookie = cookies.map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return cookie?.slice(name.length + 1) || null;
}

export function readSessionToken(request: Request) {
  return readCookie(request, sessionCookieName);
}

export function setSessionCookie(response: Response, token: string) {
  response.cookie(sessionCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: sessionLifetimeSeconds * 1000,
  });
}

export function clearSessionCookie(response: Response) {
  response.clearCookie(sessionCookieName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export function issueCsrfToken(response: Response) {
  const token = randomBytes(32).toString('hex');
  response.cookie(csrfCookieName, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
  return token;
}
