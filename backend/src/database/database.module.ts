import { Global, Module } from '@nestjs/common';
import fs from 'node:fs';
import path from 'node:path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { AuthSession, AuthUser, Course, CourseRegistration, Student } from './entities';
import { initializeSchema } from './schema';
import { DatabaseSeeder } from './seeder.service';

const entities = [Student, AuthUser, AuthSession, Course, CourseRegistration];

function getDataSourceOptions(): DataSourceOptions {
  const requiredVariables = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const configuredVariables = requiredVariables.filter((name) => process.env[name]);
  const missingVariables = requiredVariables.filter((name) => !process.env[name]);
  if (configuredVariables.length > 0 && missingVariables.length > 0) {
    throw new Error(`Incomplete MySQL configuration. Missing environment variables: ${missingVariables.join(', ')}`);
  }

  if (configuredVariables.length === 0) {
    const databasePath = process.env.UNIMANAGE_SQLITE_PATH
      || path.join(process.cwd(), '.data', 'unimanage.sqlite');
    if (databasePath !== ':memory:') fs.mkdirSync(path.dirname(databasePath), { recursive: true });
    return {
      type: 'sqljs',
      entities,
      synchronize: false,
      autoSave: databasePath !== ':memory:',
      ...(databasePath !== ':memory:' ? { location: databasePath } : {}),
    };
  }

  const ssl = process.env.DB_SSL === 'true'
    ? {
        rejectUnauthorized: true,
        ...(process.env.DB_SSL_CA ? { ca: process.env.DB_SSL_CA.replace(/\\n/g, '\n') } : {}),
      }
    : undefined;

  return {
    type: 'mysql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl,
    entities,
    synchronize: false,
  };
}

@Global()
@Module({
  providers: [
    {
      provide: DataSource,
      useFactory: async () => {
        const dataSource = new DataSource(getDataSourceOptions());
        await dataSource.initialize();
        await initializeSchema(dataSource);
        return dataSource;
      },
    },
    DatabaseSeeder,
  ],
  exports: [DataSource, DatabaseSeeder],
})
export class DatabaseModule {}
