const path = require('node:path');
const express = require('express');
const database = require('./dbconnection');
const studentRoutes = require('./routes/studentRoutes');
const initializeDatabase = require('./database/init');

const app = express();
const port = Number(process.env.PORT || 3000);
const frontendPath = path.join(__dirname, 'react-node-app');

app.use(express.json());
app.use('/api/students', studentRoutes);
app.use(express.static(path.join(frontendPath, 'dist')));

app.get('/api/health', (_request, response) => {
  database.query('SELECT 1 AS connected', (error) => {
    if (error) {
      return response.status(503).json({ status: 'degraded', database: 'unavailable' });
    }

    return response.json({ status: 'ok', database: 'connected' });
  });
});

app.get('*splat', (_request, response) => {
  response.sendFile(path.join(frontendPath, 'dist', 'index.html'));
});

initializeDatabase()
  .then(() => app.listen(port, () => {
    console.log(`WebNC is running at http://localhost:${port}`);
  }))
  .catch((error) => {
    console.error('Database initialization failed:', error.message);
    process.exitCode = 1;
  });