const database = require('../dbconnection');
const fs = require('node:fs/promises');
const path = require('node:path');

async function initializeDatabase() {
  const schema = await fs.readFile(path.join(__dirname, 'schema.sql'), 'utf8');
  await database.promise().query(schema);
}

module.exports = initializeDatabase;