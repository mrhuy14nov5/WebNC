const database = require('../dbconnection');

const studentFields = 'id, name, email, major, year, created_at';

function listStudents(search = '') {
  const value = `%${search}%`;
  return database.promise().query(
    `SELECT ${studentFields} FROM students
     WHERE name LIKE ? OR email LIKE ? OR major LIKE ?
     ORDER BY created_at DESC`,
    [value, value, value]
  ).then(([rows]) => rows);
}

function findStudent(id) {
  return database.promise().query(`SELECT ${studentFields} FROM students WHERE id = ?`, [id])
    .then(([rows]) => rows[0]);
}

function createStudent(student) {
  return database.promise().query(
    'INSERT INTO students (name, email, major, year) VALUES (?, ?, ?, ?)',
    [student.name, student.email, student.major, student.year]
  ).then(([result]) => findStudent(result.insertId));
}

function updateStudent(id, student) {
  return database.promise().query(
    'UPDATE students SET name = ?, email = ?, major = ?, year = ? WHERE id = ?',
    [student.name, student.email, student.major, student.year, id]
  ).then(() => findStudent(id));
}

function deleteStudent(id) {
  return database.promise().query('DELETE FROM students WHERE id = ?', [id]);
}

module.exports = { listStudents, findStudent, createStudent, updateStudent, deleteStudent };