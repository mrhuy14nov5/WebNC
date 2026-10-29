const authModel = require('../models/authModel');
const { randomBytes, timingSafeEqual } = require('node:crypto');

const cookieName = 'unimanage_session';

function readSessionToken(request) {
  const cookies = request.headers.cookie?.split(';') ?? [];
  const cookie = cookies.map((part) => part.trim()).find((part) => part.startsWith(`${cookieName}=`));
  return cookie?.slice(cookieName.length + 1) || null;
}

async function requireAuth(request, response, next) {
  const token = readSessionToken(request);
  if (!token) return response.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục.' });

  const user = await authModel.findUserForSession(token);
  if (!user) return response.status(401).json({ message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });
  request.user = user;
  request.sessionToken = token;
  return next();
}

function issueCsrfToken(_request, response) {
  const token = randomBytes(32).toString('hex');
  response.cookie('unimanage_csrf', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
  response.json({ csrfToken: token });
}

function requireCsrf(request, response, next) {
  const cookie = request.headers.cookie?.split(';').map((part) => part.trim())
    .find((part) => part.startsWith('unimanage_csrf='))?.slice('unimanage_csrf='.length);
  const header = request.get('x-csrf-token');
  if (!/^[a-f0-9]{64}$/.test(cookie || '') || !/^[a-f0-9]{64}$/.test(header || '') || cookie.length !== header.length
    || !timingSafeEqual(Buffer.from(cookie), Buffer.from(header))) {
    return response.status(403).json({ message: 'CSRF token không hợp lệ. Vui lòng tải lại trang.' });
  }
  return next();
}

function requireRole(role) {
  return (request, response, next) => {
    if (request.user?.role !== role) {
      return response.status(403).json({ message: 'Bạn không có quyền thực hiện thao tác này.' });
    }
    return next();
  };
}

module.exports = { cookieName, readSessionToken, requireAuth, requireRole, issueCsrfToken, requireCsrf };
