const path = require('node:path');
const express = require('express');
const database = require('./dbconnection');
const studentRoutes = require('./routes/studentRoutes');
const authRoutes = require('./routes/authRoutes');
const initializeDatabase = require('./database/init');
const localStore = database ? null : require('./database/localStore');

const app = express();
const port = Number(process.env.PORT || 3000);
const frontendPath = path.join(__dirname, 'react-node-app');

app.use(express.json());
app.use('/api/auth', authRoutes);
if (database) {
  app.use('/api/students', studentRoutes);
} else {
  app.use('/api/students', (_request, response) => {
    response.status(503).json({ message: 'API quản lý sinh viên cần cấu hình MySQL trong file .env.' });
  });
}
app.use(express.static(path.join(frontendPath, 'dist')));

app.get('/api/health', (_request, response) => {
  if (!database) {
    try {
      localStore.database.prepare('SELECT 1').get();
      return response.json({ status: 'ok', database: 'local-sqlite' });
    } catch (error) {
      console.error('Local database health check failed:', error.message);
      return response.status(503).json({ status: 'degraded', database: 'unavailable' });
    }
  }
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

app.use((error, _request, response, _next) => {
  console.error('Request failed:', error);
  response.status(500).json({ message: 'Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.' });
});

const initialize = database
  ? initializeDatabase()
  : Promise.resolve().then(() => localStore.initialize());

initialize
  .then(() => app.listen(port, () => {
    console.log(`WebNC is running at http://localhost:${port} (${database ? 'MySQL' : 'local SQLite'})`);
  }))
  .catch((error) => {
    console.error('Database initialization failed:', error.message);
    process.exitCode = 1;
  });