const authModel = require('../models/authModel');

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

function requireRole(role) {
  return (request, response, next) => {
    if (request.user?.role !== role) {
      return response.status(403).json({ message: 'Bạn không có quyền thực hiện thao tác này.' });
    }
    return next();
  };
}

module.exports = { cookieName, readSessionToken, requireAuth, requireRole };
