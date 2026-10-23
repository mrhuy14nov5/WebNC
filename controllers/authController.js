const authModel = require('../models/authModel');
const { cookieName, readSessionToken } = require('../middleware/requireAuth');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const sessionLifetimeSeconds = 7 * 24 * 60 * 60;

function setSessionCookie(response, token) {
  response.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: sessionLifetimeSeconds * 1000,
  });
}

function clearSessionCookie(response) {
  response.clearCookie(cookieName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

function isDuplicateEmailError(error) {
  return error.code === 'ER_DUP_ENTRY'
    || (error.code === 'ERR_SQLITE_ERROR' && /UNIQUE constraint failed: (students|auth_users)\.email/.test(error.message));
}

function validateCredentials(body = {}) {
  body ??= {};
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  if (!emailPattern.test(email) || email.length > 180 || password.length < 8 || password.length > 128) {
    return { message: 'Email không hợp lệ hoặc mật khẩu chưa đáp ứng yêu cầu (8–128 ký tự).' };
  }
  return { email, password };
}

async function register(request, response) {
  const body = request.body ?? {};
  const credentials = validateCredentials(body);
  const name = String(body.name ?? '').trim();
  const major = String(body.major ?? '').trim();
  const year = Number(body.year);
  if (credentials.message) return response.status(400).json({ message: credentials.message });
  if (!name || name.length > 120 || !major || major.length > 120 || !Number.isInteger(year) || year < 1 || year > 6) {
    return response.status(400).json({ message: 'Vui lòng nhập họ tên, ngành học và năm học hợp lệ.' });
  }

  try {
    const result = await authModel.register({ ...credentials, name, major, year });
    setSessionCookie(response, result.token);
    return response.status(201).json({ user: result.user });
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      return response.status(409).json({ message: 'Email này đã được đăng ký.' });
    }
    throw error;
  }
}

async function login(request, response) {
  const credentials = validateCredentials(request.body);
  if (credentials.message) return response.status(400).json({ message: credentials.message });
  const result = await authModel.login(credentials.email, credentials.password);
  if (!result) return response.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
  setSessionCookie(response, result.token);
  return response.json({ user: result.user });
}

async function currentUser(request, response) {
  const token = readSessionToken(request);
  const user = token ? await authModel.findUserForSession(token) : null;
  return response.json({ user });
}

async function logout(request, response) {
  const token = readSessionToken(request);
  if (token) await authModel.deleteSession(token);
  clearSessionCookie(response);
  return response.status(204).send();
}

module.exports = { register, login, currentUser, logout };
