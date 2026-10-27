const path = require('node:path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const database = require('./dbconnection');
const studentRoutes = require('./routes/studentRoutes');
const courseRoutes = require('./routes/courseRoutes');
const authRoutes = require('./routes/authRoutes');
const initializeDatabase = require('./database/init');
const localStore = database ? null : require('./database/localStore');
const authModel = require('./models/authModel');
const { requireCsrf } = require('./middleware/requireAuth');

const app = express();
const port = Number(process.env.PORT || 3000);
const frontendPath = path.join(__dirname, 'react-node-app');
const allowedOrigins = new Set((process.env.CORS_ORIGINS
  || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5173,http://127.0.0.1:5173'))
  .split(',').map((origin) => origin.trim()).filter(Boolean));

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    callback(null, !origin || allowedOrigins.has(origin));
  },
  credentials: true,
}));
app.use(express.json({ limit: '32kb' }));
app.use('/api', (request, response, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) return requireCsrf(request, response, next);
  return next();
});
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/students', studentRoutes);
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
    if (error) return response.status(503).json({ status: 'degraded', database: 'unavailable' });
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
  : Promise.resolve().then(async () => {
    localStore.initialize();
    await authModel.seedAdmin();
    const { database: sqlite } = localStore;
    const seed = sqlite.prepare('INSERT OR IGNORE INTO courses (id, name, code, credits, lecturer, capacity, faculty, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    for (const course of require('./database/courseSeed')) {
      seed.run(course.id, course.name, course.code, course.credits, course.lecturer, course.capacity, course.faculty, course.description);
    }
  });

if (require.main === module) {
  initialize
    .then(() => app.listen(port, () => {
      const cleanupTimer = setInterval(() => authModel.cleanupExpiredSessions().catch((error) => console.error('Session cleanup failed:', error.message)), 60 * 60 * 1000);
      cleanupTimer.unref();
      authModel.cleanupExpiredSessions().catch((error) => console.error('Session cleanup failed:', error.message));
      console.log(`WebNC is running at http://localhost:${port} (${database ? 'MySQL' : 'local SQLite'})`);
    }))
    .catch((error) => {
      console.error('Database initialization failed:', error.message);
      process.exitCode = 1;
    });
}

module.exports = { app, initialize };