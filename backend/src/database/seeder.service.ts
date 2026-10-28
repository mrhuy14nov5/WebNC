import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import bcrypt from 'bcryptjs';
import { AuthSession, AuthUser, Course, Student } from './entities';
import { courseSeed } from './course-seed';

@Injectable()
export class DatabaseSeeder {
  constructor(private readonly dataSource: DataSource) {}

  async seed() {
    await this.seedAdmin();
    await this.seedCourses();
  }

  private async seedAdmin() {
    const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD || '';
    if (!email && !password) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12 || password.length > 128) {
      throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD (12–128 characters) are required to seed an administrator.');
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await this.dataSource.transaction(async (manager) => {
      const users = manager.getRepository(AuthUser);
      const current = await users.findOne({ where: { email }, relations: { student: true } });
      if (current) {
        if (current.role !== 'admin') {
          current.role = 'admin';
          current.passwordHash = passwordHash;
          current.passwordSalt = '';
          await users.save(current);
          await manager.getRepository(AuthSession).delete({ userId: current.id });
        }
        return;
      }
      const student = await manager.getRepository(Student).save({
        name: 'Quản trị viên',
        email,
        major: 'Quản trị hệ thống',
        year: 1,
      });
      await users.save({
        studentId: student.id,
        email,
        passwordHash,
        passwordSalt: '',
        role: 'admin',
      });
    });
  }

  private async seedCourses() {
    const courses = this.dataSource.getRepository(Course);
    for (const course of courseSeed) {
      const existing = await courses.findOne({ where: { id: course.id } });
      if (!existing) await courses.save(course);
    }
  }
}
