const { createHash, randomBytes, scrypt, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');
const database = require('../dbconnection');
const localStore = database ? null : require('../database/localStore');

const scryptAsync = promisify(scrypt);
const sessionLifetimeMs = 7 * 24 * 60 * 60 * 1000;

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

async function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const derivedKey = await scryptAsync(password, salt, 64);
  return { hash: derivedKey.toString('hex'), salt };
}

async function verifyPassword(password, storedHash, salt) {
  const { hash } = await hashPassword(password, salt);
  const actual = Buffer.from(hash, 'hex');
  const expected = Buffer.from(storedHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
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
  const token = randomBytes(32).toString('hex');
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
    await connection.execute(
      'INSERT INTO auth_sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [userResult.insertId, hashToken(token), expiresAt]
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

    const token = randomBytes(32).toString('hex');
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

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + sessionLifetimeMs);
  await database.promise().execute(
    'INSERT INTO auth_sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [account.id, hashToken(token), expiresAt]
  );
  return { user: publicUser(account), token };
}

async function findUserForSession(token) {
  if (!database) {
    const account = localStore.database.prepare(
      `SELECT users.id, users.role, students.name, students.email, students.major, students.year
       FROM auth_sessions AS sessions
       JOIN auth_users AS users ON users.id = sessions.user_id
       JOIN students ON students.id = users.student_id
       WHERE sessions.token_hash = ? AND sessions.expires_at > ?`
    ).get(hashToken(token), Date.now());
    return account ? publicUser(account) : null;
  }

  const [rows] = await database.promise().execute(
    `SELECT users.id, users.role, students.name, students.email, students.major, students.year
     FROM auth_sessions AS sessions
     JOIN auth_users AS users ON users.id = sessions.user_id
     JOIN students ON students.id = users.student_id
     WHERE sessions.token_hash = ? AND sessions.expires_at > NOW()`,
    [hashToken(token)]
  );
  return rows[0] ? publicUser(rows[0]) : null;
}

function deleteSession(token) {
  if (!database) {
    return localStore.database.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').run(hashToken(token));
  }
  return database.promise().execute('DELETE FROM auth_sessions WHERE token_hash = ?', [hashToken(token)]);
}

module.exports = { register, login, findUserForSession, deleteSession };
