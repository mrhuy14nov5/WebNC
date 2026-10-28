import { timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { csrfCookieName, readCookie } from './cookies';

export function requireCsrf(request: Request, response: Response, next: NextFunction) {
  const cookie = readCookie(request, csrfCookieName);
  const header = request.get('x-csrf-token');
  if (!/^[a-f0-9]{64}$/.test(cookie || '') || !/^[a-f0-9]{64}$/.test(header || '') || cookie.length !== header.length
    || !timingSafeEqual(Buffer.from(cookie), Buffer.from(header))) {
    return response.status(403).json({ message: 'CSRF token không hợp lệ. Vui lòng tải lại trang.' });
  }
  return next();
}

export function csrfMiddleware(request: Request, response: Response, next: NextFunction) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) return next();
  return requireCsrf(request, response, next);
}
