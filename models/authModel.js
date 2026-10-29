const { createHash, randomBytes, scrypt, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const database = require('../dbconnection');
const localStore = database ? null : require('../database/localStore');

const scryptAsync = promisify(scrypt);
const sessionLifetimeMs = 7 * 24 * 60 * 60 * 1000;
const sessionSecret = process.env.SESSION_SECRET
  || (process.env.NODE_ENV === 'production' ? '' : randomBytes(32).toString('hex'));
if (!sessionSecret || (process.env.NODE_ENV === 'production' && sessionSecret.length < 32)) {
  throw new Error('A SESSION_SECRET with at least 32 characters is required in production.');
}

function mysqlDateTime(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function cleanupExpiredSessions() {
  if (!database) {
    return Promise.resolve(localStore.database.prepare('DELETE FROM auth_sessions WHERE expires_at <= ?').run(Date.now()));
  }
  return database.promise().execute('DELETE FROM auth_sessions WHERE expires_at <= UTC_TIMESTAMP()');
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

async function hashLegacyPassword(password, salt) {
  const derivedKey = await scryptAsync(password, salt, 64);
  return derivedKey.toString('hex');
}

async function hashPassword(password) {
  return { hash: await bcrypt.hash(password, 12), salt: '' };
}

async function verifyPassword(password, storedHash, salt) {
  if (/^\$2[aby]\$/.test(storedHash)) return bcrypt.compare(password, storedHash);
  const hash = await hashLegacyPassword(password, salt);
  const actual = Buffer.from(hash, 'hex');
  const expected = Buffer.from(storedHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function createSessionToken(userId) {
  return jwt.sign({ sub: String(userId), jti: randomBytes(16).toString('hex') }, sessionSecret, {
    expiresIn: sessionLifetimeMs / 1000,
  });
}

async function upgradePasswordHash(userId, password) {
  const credentials = await hashPassword(password);
  if (!database) {
    localStore.database.prepare('UPDATE auth_users SET password_hash = ?, password_salt = ? WHERE id = ?')
      .run(credentials.hash, credentials.salt, userId);
    return;
  }
  await database.promise().execute(
    'UPDATE auth_users SET password_hash = ?, password_salt = ? WHERE id = ?',
    [credentials.hash, credentials.salt, userId]
  );
}

function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    major: row.major,
    year: row.year,
    role: row.role,
  };
}

async function register({ name, email, major, year, password }) {
  const credentials = await hashPassword(password);
  const expiresAt = new Date(Date.now() + sessionLifetimeMs);

  if (!database) {
    const localDatabase = localStore.database;
    localDatabase.exec('BEGIN IMMEDIATE');
    try {
      const studentResult = localDatabase.prepare(
        'INSERT INTO students (name, email, major, year) VALUES (?, ?, ?, ?)'
      ).run(name, email, major, year);
      const userResult = localDatabase.prepare(
        'INSERT INTO auth_users (student_id, email, password_hash, password_salt) VALUES (?, ?, ?, ?)'
      ).run(Number(studentResult.lastInsertRowid), email, credentials.hash, credentials.salt);
      const token = createSessionToken(Number(userResult.lastInsertRowid));
      localDatabase.prepare(
        'INSERT INTO auth_sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)'
      ).run(Number(userResult.lastInsertRowid), hashToken(token), expiresAt.getTime());
      localDatabase.exec('COMMIT');
      return {
        user: publicUser({ id: Number(userResult.lastInsertRowid), name, email, major, year, role: 'student' }),
        token,
      };
    } catch (error) {
      localDatabase.exec('ROLLBACK');
      throw error;
    }
  }

  const connection = await database.promise().getConnection();
  try {
    await connection.beginTransaction();
    const [studentResult] = await connection.execute(
      'INSERT INTO students (name, email, major, year) VALUES (?, ?, ?, ?)',
      [name, email, major, year]
    );
    const [userResult] = await connection.execute(
      'INSERT INTO auth_users (student_id, email, password_hash, password_salt) VALUES (?, ?, ?, ?)',
      [studentResult.insertId, email, credentials.hash, credentials.salt]
    );
    const token = createSessionToken(userResult.insertId);
    await connection.execute(
      'INSERT INTO auth_sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [userResult.insertId, hashToken(token), mysqlDateTime(expiresAt)]
    );
    await connection.commit();
    return { user: publicUser({ id: userResult.insertId, name, email, major, year, role: 'student' }), token };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function login(email, password) {
  if (!database) {
    const localDatabase = localStore.database;
    const account = localDatabase.prepare(
      `SELECT users.id, users.password_hash, users.password_salt, users.role,
              students.name, students.email, students.major, students.year
       FROM auth_users AS users
       JOIN students ON students.id = users.student_id
       WHERE users.email = ?`
    ).get(email);
    const valid = account
      ? await verifyPassword(password, account.password_hash, account.password_salt)
      : await verifyPassword(password, '0'.repeat(128), '0'.repeat(32));
    if (!account || !valid) return null;
    if (!/^\$2[aby]\$/.test(account.password_hash)) await upgradePasswordHash(account.id, password);

    const token = createSessionToken(account.id);
    localDatabase.prepare('DELETE FROM auth_sessions WHERE user_id = ?').run(account.id);
    localDatabase.prepare(
      'INSERT INTO auth_sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)'
    ).run(account.id, hashToken(token), Date.now() + sessionLifetimeMs);
    return { user: publicUser(account), token };
  }

  const [rows] = await database.promise().execute(
    `SELECT users.id, users.password_hash, users.password_salt, users.role,
            students.name, students.email, students.major, students.year
     FROM auth_users AS users
     JOIN students ON students.id = users.student_id
     WHERE users.email = ?`,
    [email]
  );
  const account = rows[0];
  const valid = account
    ? await verifyPassword(password, account.password_hash, account.password_salt)
    : await verifyPassword(password, '0'.repeat(128), '0'.repeat(32));
  if (!account || !valid) return null;
  if (!/^\$2[aby]\$/.test(account.password_hash)) await upgradePasswordHash(account.id, password);

  const token = createSessionToken(account.id);
  const expiresAt = new Date(Date.now() + sessionLifetimeMs);
  await database.promise().execute('DELETE FROM auth_sessions WHERE user_id = ?', [account.id]);
  await database.promise().execute(
    'INSERT INTO auth_sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [account.id, hashToken(token), mysqlDateTime(expiresAt)]
  );
  return { user: publicUser(account), token };
}

async function findUserForSession(token) {
  let payload;
  try {
    payload = jwt.verify(token, sessionSecret, { algorithms: ['HS256'] });
  } catch {
    return null;
  }
  if (!payload || typeof payload !== 'object' || !payload.sub) return null;

  if (!database) {
    const account = localStore.database.prepare(
      `SELECT users.id, users.role, students.name, students.email, students.major, students.year
       FROM auth_sessions AS sessions
       JOIN auth_users AS users ON users.id = sessions.user_id
       JOIN students ON students.id = users.student_id
       WHERE sessions.token_hash = ? AND sessions.expires_at > ?`
    ).get(hashToken(token), Date.now());
    return account && String(account.id) === payload.sub ? publicUser(account) : null;
  }

  const [rows] = await database.promise().execute(
    `SELECT users.id, users.role, students.name, students.email, students.major, students.year
     FROM auth_sessions AS sessions
     JOIN auth_users AS users ON users.id = sessions.user_id
     JOIN students ON students.id = users.student_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > UTC_TIMESTAMP()`,
    [hashToken(token)]
  );
  return rows[0] && String(rows[0].id) === payload.sub ? publicUser(rows[0]) : null;
}

async function seedAdmin() {
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  if (!email && !password) return false;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12 || password.length > 128) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD (12–128 characters) are required to seed an administrator.');
  }
  const credentials = await hashPassword(password);
  if (!database) {
    const db = localStore.database;
    db.exec('BEGIN IMMEDIATE');
    try {
      const current = db.prepare('SELECT id, student_id, role FROM auth_users WHERE email = ?').get(email);
      if (current) {
        if (current.role !== 'admin') {
          db.prepare("UPDATE auth_users SET role = 'admin', password_hash = ?, password_salt = ? WHERE id = ?")
            .run(credentials.hash, credentials.salt, current.id);
          db.prepare('DELETE FROM auth_sessions WHERE user_id = ?').run(current.id);
        }
        db.exec('COMMIT');
        return true;
      }
      const student = db.prepare('INSERT INTO students (name, email, major, year) VALUES (?, ?, ?, ?)').run('Quản trị viên', email, 'Quản trị hệ thống', 1);
      db.prepare("INSERT INTO auth_users (student_id, email, password_hash, password_salt, role) VALUES (?, ?, ?, ?, 'admin')")
        .run(Number(student.lastInsertRowid), email, credentials.hash, credentials.salt);
      db.exec('COMMIT');
      return true;
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
  const existing = await database.promise().execute('SELECT id, role FROM auth_users WHERE email = ?', [email]);
  if (existing[0][0]) {
    if (existing[0][0].role !== 'admin') {
      await database.promise().execute("UPDATE auth_users SET role = 'admin', password_hash = ?, password_salt = ? WHERE id = ?", [credentials.hash, credentials.salt, existing[0][0].id]);
      await database.promise().execute('DELETE FROM auth_sessions WHERE user_id = ?', [existing[0][0].id]);
    }
    return true;
  }
  const connection = await database.promise().getConnection();
  try {
    await connection.beginTransaction();
    const [student] = await connection.execute('INSERT INTO students (name, email, major, year) VALUES (?, ?, ?, ?)', ['Quản trị viên', email, 'Quản trị hệ thống', 1]);
    await connection.execute("INSERT INTO auth_users (student_id, email, password_hash, password_salt, role) VALUES (?, ?, ?, ?, 'admin')", [student.insertId, email, credentials.hash, credentials.salt]);
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

function deleteSession(token) {
  if (!database) {
    return localStore.database.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').run(hashToken(token));
  }
  return database.promise().execute('DELETE FROM auth_sessions WHERE token_hash = ?', [hashToken(token)]);
}

module.exports = { register, login, findUserForSession, deleteSession, cleanupExpiredSessions, seedAdmin };
