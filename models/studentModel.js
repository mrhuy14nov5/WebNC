const database = require('../dbconnection');
const localStore = database ? null : require('../database/localStore');

const studentFields = 'id, name, email, major, year, created_at';

function listStudents(search = '') {
  const escaped = search.replace(/[\\%_]/g, '\\$&');
  const value = `%${escaped}%`;
  if (!database) return localStore.database.prepare(
    `SELECT ${studentFields} FROM students WHERE name LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\' OR major LIKE ? ESCAPE '\\' ORDER BY created_at DESC`
  ).all(value, value, value);
  return database.promise().query(
    `SELECT ${studentFields} FROM students
     WHERE name LIKE ? ESCAPE '\\\\' OR email LIKE ? ESCAPE '\\\\' OR major LIKE ? ESCAPE '\\\\'
     ORDER BY created_at DESC`,
    [value, value, value]
  ).then(([rows]) => rows);
}

function findStudent(id) {
  if (!database) return localStore.database.prepare(`SELECT ${studentFields} FROM students WHERE id = ?`).get(id);
  return database.promise().query(`SELECT ${studentFields} FROM students WHERE id = ?`, [id])
    .then(([rows]) => rows[0]);
}

function createStudent(student) {
  if (!database) {
    const result = localStore.database.prepare('INSERT INTO students (name, email, major, year) VALUES (?, ?, ?, ?)').run(student.name, student.email, student.major, student.year);
    return findStudent(Number(result.lastInsertRowid));
  }
  return database.promise().query(
    'INSERT INTO students (name, email, major, year) VALUES (?, ?, ?, ?)',
    [student.name, student.email, student.major, student.year]
  ).then(([result]) => findStudent(result.insertId));
}

function updateStudent(id, student) {
  if (!database) {
    localStore.database.prepare('UPDATE students SET name = ?, email = ?, major = ?, year = ? WHERE id = ?').run(student.name, student.email, student.major, student.year, id);
    return findStudent(id);
  }
  return database.promise().query(
    'UPDATE students SET name = ?, email = ?, major = ?, year = ? WHERE id = ?',
    [student.name, student.email, student.major, student.year, id]
  ).then(() => findStudent(id));
}

function deleteStudent(id) {
  if (!database) return localStore.database.prepare('DELETE FROM students WHERE id = ?').run(id);
  return database.promise().query('DELETE FROM students WHERE id = ?', [id]);
}

module.exports = { listStudents, findStudent, createStudent, updateStudent, deleteStudent };