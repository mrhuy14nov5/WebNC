import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import path from 'node:path';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { csrfMiddleware } from './common/csrf.middleware';
import { DatabaseSeeder } from './database/seeder.service';
import { AuthSession, AuthUser, Course, CourseRegistration, Student } from './database/entities';

export async function createApplication() {
  const nestApp = await NestFactory.create(AppModule, {
    bodyParser: false,
    logger: ['error', 'warn'],
  });
  const expressApp = nestApp.getHttpAdapter().getInstance();
  nestApp.setGlobalPrefix('api');
  const allowedOrigins = new Set((process.env.CORS_ORIGINS
    || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5173,http://127.0.0.1:5173'))
    .split(',').map((origin) => origin.trim()).filter(Boolean));

  expressApp.use(helmet());
  expressApp.use(cors({
    origin(origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
      callback(null, !origin || allowedOrigins.has(origin));
    },
    credentials: true,
  }));
  expressApp.use(express.json({ limit: '32kb' }));
  expressApp.use('/api', csrfMiddleware);

  const skipRateLimit = () => process.env.DISABLE_RATE_LIMIT === 'true';
  expressApp.use('/api/auth/login', rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: skipRateLimit,
    message: { message: 'Quá nhiều lần đăng nhập. Vui lòng thử lại sau 15 phút.' },
  }));
  expressApp.use('/api/auth/register', rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: skipRateLimit,
    message: { message: 'Quá nhiều yêu cầu đăng ký. Vui lòng thử lại sau.' },
  }));
  expressApp.use('/api/docs', (_request: express.Request, response: express.Response, next: express.NextFunction) => {
    response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:");
    next();
  });

  nestApp.useGlobalFilters(new AllExceptionsFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('UniManage API')
    .setDescription('API quản lý sinh viên, giảng viên, học phần và đăng ký học phần. Xác thực bằng cookie phiên httpOnly và CSRF double-submit.')
    .setVersion('1.0.0')
    .addCookieAuth('unimanage_session', { type: 'apiKey', in: 'cookie', name: 'unimanage_session' })
    .addTag('Auth')
    .addTag('Courses')
    .addTag('Students')
    .addTag('Lecturers')
    .addTag('Health')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(nestApp, swaggerConfig);
  SwaggerModule.setup('api/docs', nestApp, swaggerDocument);

  const frontendPath = path.join(process.cwd(), 'react-node-app', 'dist');
  const frontendFiles = express.static(frontendPath);
  expressApp.use((request: express.Request, response: express.Response, next: express.NextFunction) => {
    if (/^\/api(?:\/|$)/.test(request.path)) return next();
    return frontendFiles(request, response, next);
  });
  expressApp.get(/^(?!\/api(?:\/|$)).*/, (_request: express.Request, response: express.Response) => {
    response.sendFile(path.join(frontendPath, 'index.html'));
  });

  await nestApp.init();

  const dataSource = nestApp.get(DataSource);
  const authService = nestApp.get(AuthService);
  const initialize = async () => {
    await nestApp.get(DatabaseSeeder).seed();
    await authService.cleanupExpiredSessions();
  };

  return {
    nestApp,
    app: expressApp,
    dataSource,
    authService,
    initialize,
    entities: { Student, AuthUser, AuthSession, Course, CourseRegistration },
    close: () => nestApp.close(),
  };
}

export async function startApplication() {
  const application = await createApplication();
  await application.initialize();
  const port = Number(process.env.PORT || 3000);
  const databaseType = application.dataSource.options.type === 'mysql' ? 'MySQL' : 'local SQLite';
  application.app.listen(port, () => {
    console.log(`WebNC is running at http://localhost:${port} (${databaseType})`);
  });
  const cleanupTimer = setInterval(() => {
    application.authService.cleanupExpiredSessions()
      .catch((error: Error) => console.error('Session cleanup failed:', error.message));
  }, 60 * 60 * 1000);
  cleanupTimer.unref();
  return application;
}
