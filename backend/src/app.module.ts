import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health/health.controller';
import { LecturersModule } from './lecturers/lecturers.module';
import { StudentsModule } from './students/students.module';

@Module({
  imports: [DatabaseModule, AuthModule, StudentsModule, CoursesModule, LecturersModule],
  controllers: [HealthController],
})
export class AppModule {}
