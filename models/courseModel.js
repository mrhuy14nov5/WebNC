const database = require('../dbconnection');
const localStore = database ? null : require('../database/localStore');

const fields = `courses.id, courses.name, courses.code, courses.credits, courses.lecturer,
  courses.capacity, courses.faculty, courses.description, courses.created_at,
  COUNT(course_registrations.id) AS enrolled,
  courses.capacity - COUNT(course_registrations.id) AS remaining`;

function listCourses({ search = '', faculty = '' } = {}) {
  const escaped = search.replace(/[\\%_]/g, '\\$&');
  const pattern = `%${escaped}%`;
  if (!database) {
    return localStore.database.prepare(
      `SELECT ${fields} FROM courses LEFT JOIN course_registrations ON course_registrations.course_id = courses.id
       WHERE (courses.name LIKE ? ESCAPE '\\' OR courses.code LIKE ? ESCAPE '\\' OR courses.faculty LIKE ? ESCAPE '\\')
       AND (? = '' OR courses.faculty = ?) GROUP BY courses.id ORDER BY courses.code`
    ).all(pattern, pattern, pattern, faculty, faculty);
  }
  return database.promise().execute(
    `SELECT ${fields} FROM courses LEFT JOIN course_registrations ON course_registrations.course_id = courses.id
     WHERE (courses.name LIKE ? ESCAPE '\\\\' OR courses.code LIKE ? ESCAPE '\\\\' OR courses.faculty LIKE ? ESCAPE '\\\\')
     AND (? = '' OR courses.faculty = ?) GROUP BY courses.id ORDER BY courses.code`,
    [pattern, pattern, pattern, faculty, faculty]
  ).then(([rows]) => rows);
}

function findCourse(id) {
  const query = `SELECT ${fields} FROM courses LEFT JOIN course_registrations ON course_registrations.course_id = courses.id
    WHERE courses.id = ? GROUP BY courses.id`;
  if (!database) return localStore.database.prepare(query).get(id);
  return database.promise().execute(query, [id]).then(([rows]) => rows[0]);
}

async function registerForCourse(userId, courseId) {
  if (!database) {
    const db = localStore.database;
    db.exec('BEGIN IMMEDIATE');
    try {
      const user = db.prepare('SELECT student_id FROM auth_users WHERE id = ?').get(userId);
      const course = db.prepare('SELECT capacity FROM courses WHERE id = ?').get(courseId);
      if (!course) throw Object.assign(new Error('COURSE_NOT_FOUND'), { code: 'COURSE_NOT_FOUND' });
      const count = db.prepare('SELECT COUNT(*) AS total FROM course_registrations WHERE course_id = ?').get(courseId).total;
      if (count >= course.capacity) throw Object.assign(new Error('COURSE_FULL'), { code: 'COURSE_FULL' });
      db.prepare('INSERT INTO course_registrations (student_id, course_id) VALUES (?, ?)').run(user.student_id, courseId);
      db.exec('COMMIT');
      return true;
    } catch (error) {
      db.exec('ROLLBACK');
      if (/UNIQUE constraint failed/.test(error.message)) error.code = 'ALREADY_REGISTERED';
      throw error;
    }
  }
  const connection = await database.promise().getConnection();
  try {
    await connection.beginTransaction();
    const [[user]] = await connection.execute('SELECT student_id FROM auth_users WHERE id = ?', [userId]);
    const [[course]] = await connection.execute('SELECT capacity FROM courses WHERE id = ? FOR UPDATE', [courseId]);
    if (!course) throw Object.assign(new Error('COURSE_NOT_FOUND'), { code: 'COURSE_NOT_FOUND' });
    const [[{ total }]] = await connection.execute('SELECT COUNT(*) AS total FROM course_registrations WHERE course_id = ?', [courseId]);
    if (total >= course.capacity) throw Object.assign(new Error('COURSE_FULL'), { code: 'COURSE_FULL' });
    await connection.execute('INSERT INTO course_registrations (student_id, course_id) VALUES (?, ?)', [user.student_id, courseId]);
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') error.code = 'ALREADY_REGISTERED';
    throw error;
  } finally {
    connection.release();
  }
}

function listRegistrations(userId) {
  const query = `SELECT courses.id, courses.name, courses.code, courses.credits, courses.lecturer, courses.faculty, course_registrations.created_at AS registered_at
    FROM course_registrations JOIN courses ON courses.id = course_registrations.course_id
    JOIN auth_users ON auth_users.student_id = course_registrations.student_id WHERE auth_users.id = ? ORDER BY course_registrations.created_at DESC`;
  if (!database) return localStore.database.prepare(query).all(userId);
  return database.promise().execute(query, [userId]).then(([rows]) => rows);
}

function unregisterFromCourse(userId, courseId) {
  if (!database) return localStore.database.prepare(
    'DELETE FROM course_registrations WHERE course_id = ? AND student_id = (SELECT student_id FROM auth_users WHERE id = ?)'
  ).run(courseId, userId).changes;
  return database.promise().execute(
    'DELETE registrations FROM course_registrations AS registrations JOIN auth_users ON auth_users.student_id = registrations.student_id WHERE registrations.course_id = ? AND auth_users.id = ?',
    [courseId, userId]
  ).then(([result]) => result.affectedRows);
}

module.exports = { listCourses, findCourse, registerForCourse, listRegistrations, unregisterFromCourse };
