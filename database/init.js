const database = require('../dbconnection');
const fs = require('node:fs/promises');
const path = require('node:path');
const authModel = require('../models/authModel');
const courses = require('./courseSeed');

async function initializeDatabase() {
  const schema = await fs.readFile(path.join(__dirname, 'schema.sql'), 'utf8');
  const statements = schema.split(';').map((statement) => statement.trim()).filter(Boolean);
  for (const statement of statements) {
    await database.promise().query(statement);
  }
  await authModel.seedAdmin();
  for (const course of courses) {
    await database.promise().execute(
      'INSERT INTO courses (id, name, code, credits, lecturer, capacity, faculty, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id = id',
      [course.id, course.name, course.code, course.credits, course.lecturer, course.capacity, course.faculty, course.description]
    );
  }
}

module.exports = initializeDatabase;