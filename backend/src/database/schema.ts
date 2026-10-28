import { DataSource } from 'typeorm';

const sqliteSchema = `
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    major TEXT NOT NULL,
    year INTEGER NOT NULL CHECK (year BETWEEN 1 AND 6),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS auth_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS auth_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_auth_sessions_expiry ON auth_sessions(expires_at);
  CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    credits INTEGER NOT NULL,
    lecturer TEXT NOT NULL,
    lecturer_id INTEGER,
    capacity INTEGER NOT NULL,
    faculty TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS course_registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, course_id)
  );
`;

const mysqlSchema = `
  CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    major VARCHAR(120) NOT NULL,
    year TINYINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS auth_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL UNIQUE,
    email VARCHAR(180) NOT NULL UNIQUE,
    password_hash CHAR(128) NOT NULL,
    password_salt CHAR(32) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_auth_users_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS auth_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_auth_sessions_expiry (expires_at),
    CONSTRAINT fk_auth_sessions_user FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS courses (
    id VARCHAR(40) PRIMARY KEY,
    name VARCHAR(180) NOT NULL,
    code VARCHAR(30) NOT NULL UNIQUE,
    credits TINYINT UNSIGNED NOT NULL,
    lecturer VARCHAR(120) NOT NULL,
    lecturer_id INT NULL,
    capacity INT UNSIGNED NOT NULL,
    faculty VARCHAR(120) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_courses_lecturer (lecturer_id)
  );
  CREATE TABLE IF NOT EXISTS course_registrations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id VARCHAR(40) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_course_registration (student_id, course_id),
    CONSTRAINT fk_registration_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_registration_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
  );
`;

async function ensureSqliteCourseLecturerColumn(dataSource: DataSource) {
  const columns: Array<{ name: string }> = await dataSource.query('PRAGMA table_info(courses)');
  if (!columns.some((column) => column.name === 'lecturer_id')) {
    await dataSource.query('ALTER TABLE courses ADD COLUMN lecturer_id INTEGER');
  }
  const indexes: Array<{ name: string }> = await dataSource.query('PRAGMA index_list(courses)');
  if (!indexes.some((index) => index.name === 'idx_courses_lecturer')) {
    await dataSource.query('CREATE INDEX IF NOT EXISTS idx_courses_lecturer ON courses(lecturer_id)');
  }
}

function unwrapRows(result: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(result) && Array.isArray(result[0])) {
    return result[0] as Array<Record<string, unknown>>;
  }
  return Array.isArray(result) ? result as Array<Record<string, unknown>> : [];
}

async function ensureMysqlCourseLecturerColumn(dataSource: DataSource) {
  const columns = unwrapRows(await dataSource.query("SHOW COLUMNS FROM courses LIKE 'lecturer_id'"));
  if (!columns.length) {
    await dataSource.query('ALTER TABLE courses ADD COLUMN lecturer_id INT NULL');
  }
  const indexes = unwrapRows(await dataSource.query("SHOW INDEX FROM courses WHERE Key_name = 'idx_courses_lecturer'"));
  if (!indexes.length) {
    await dataSource.query('ALTER TABLE courses ADD INDEX idx_courses_lecturer (lecturer_id)');
  }
  const sessionColumns = unwrapRows(await dataSource.query("SHOW COLUMNS FROM auth_sessions LIKE 'expires_at'"));
  const sessionType = String(sessionColumns[0]?.Type || '').toLowerCase();
  if (sessionColumns.length && !sessionType.startsWith('bigint')) {
    await dataSource.query('DELETE FROM auth_sessions');
    await dataSource.query('ALTER TABLE auth_sessions MODIFY expires_at BIGINT NOT NULL');
  }
}

export async function initializeSchema(dataSource: DataSource) {
  if (dataSource.options.type === 'mysql') {
    for (const statement of mysqlSchema.split(';').map((part) => part.trim()).filter(Boolean)) {
      await dataSource.query(statement);
    }
    await ensureMysqlCourseLecturerColumn(dataSource);
    return;
  }
  await dataSource.query('PRAGMA foreign_keys = ON');
  for (const statement of sqliteSchema.split(';').map((part) => part.trim()).filter(Boolean)) {
    await dataSource.query(statement);
  }
  await ensureSqliteCourseLecturerColumn(dataSource);
}
