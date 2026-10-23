const database = require('../dbconnection');
const fs = require('node:fs/promises');
const path = require('node:path');

async function initializeDatabase() {
  const schema = await fs.readFile(path.join(__dirname, 'schema.sql'), 'utf8');
  const statements = schema.split(';').map((statement) => statement.trim()).filter(Boolean);
  for (const statement of statements) {
    await database.promise().query(statement);
  }
}

module.exports = initializeDatabase;