import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { DataSource, FindOneOptions, In } from 'typeorm';
import { AuthSession, AuthUser, Course, Student } from '../database/entities';

function escapeLike(search: string) {
  return search.replace(/[\\%_]/g, '\\$&');
}

type CourseWithCount = Course & { enrolledCount?: number };

@Injectable()
export class LecturersService {
  constructor(private readonly dataSource: DataSource) {}

  private get users() {
    return this.dataSource.getRepository(AuthUser);
  }

  private mapLecturer(user: AuthUser) {
    const courses = user.assignedCourses ?? [];
    return {
      id: user.id,
      name: user.student.name,
      email: user.student.email,
      faculty: user.student.major,
      createdAt: user.student.createdAt,
      courseCount: courses.length,
      courseIds: courses.map((course) => course.id),
      courseCodes: courses.map((course) => course.code),
    };
  }

  private baseQuery() {
    return this.users.createQueryBuilder('user')
      .innerJoinAndSelect('user.student', 'student')
      .leftJoinAndSelect('user.assignedCourses', 'course')
      .where('user.role = :role', { role: 'lecturer' });
  }

  async list(search = '') {
    const query = this.baseQuery();
    if (search) {
      const escapeClause = this.dataSource.options.type === 'mysql' ? "ESCAPE '\\\\'" : "ESCAPE '\\'";
      query.andWhere(`(student.name LIKE :value ${escapeClause} OR student.email LIKE :value ${escapeClause} OR student.major LIKE :value ${escapeClause})`, {
        value: `%${escapeLike(search)}%`,
      });
    }
    const users = await query.orderBy('student.name', 'ASC').getMany();
    return users.map((user) => this.mapLecturer(user));
  }

  async find(id: number) {
    const user = await this.baseQuery().andWhere('user.id = :id', { id }).getOne();
    return user ? this.mapLecturer(user) : null;
  }

  async create(lecturer: { name: string; email: string; faculty: string; password: string }) {
    const passwordHash = await bcrypt.hash(lecturer.password, 12);
    const user = await this.dataSource.transaction(async (manager) => {
      const student = await manager.getRepository(Student).save({
        name: lecturer.name,
        email: lecturer.email,
        major: lecturer.faculty,
        year: 1,
      });
      return manager.getRepository(AuthUser).save({
        studentId: student.id,
        email: lecturer.email,
        passwordHash,
        passwordSalt: '',
        role: 'lecturer',
      });
    });
    return this.find(user.id);
  }

  async update(id: number, lecturer: { name: string; email: string; faculty: string; password?: string }) {
    const passwordHash = lecturer.password ? await bcrypt.hash(lecturer.password, 12) : null;
    const found = await this.dataSource.transaction(async (manager) => {
      const findOptions: FindOneOptions<AuthUser> = { where: { id, role: 'lecturer' }, relations: { student: true } };
      if (this.dataSource.options.type === 'mysql') findOptions.lock = { mode: 'pessimistic_write' };
      const user = await manager.getRepository(AuthUser).findOne(findOptions);
      if (!user) return false;
      await manager.getRepository(Student).update(user.studentId, {
        name: lecturer.name,
        email: lecturer.email,
        major: lecturer.faculty,
      });
      await manager.getRepository(AuthUser).update(id, {
        email: lecturer.email,
        ...(passwordHash ? { passwordHash, passwordSalt: '' } : {}),
      });
      await manager.getRepository(Course).update({ lecturerId: id }, { lecturer: lecturer.name });
      return true;
    });
    return found ? this.find(id) : null;
  }

  async remove(id: number) {
    const removed = await this.dataSource.transaction(async (manager) => {
      const user = await manager.getRepository(AuthUser).findOneBy({ id, role: 'lecturer' });
      if (!user) return false;
      await manager.getRepository(Course).update({ lecturerId: id }, { lecturerId: null });
      await manager.getRepository(AuthSession).delete({ userId: id });
      await manager.getRepository(AuthUser).delete(id);
      await manager.getRepository(Student).delete(user.studentId);
      return true;
    });
    return removed;
  }

  private mapAssignedCourse(course: CourseWithCount) {
    const enrolled = Number(course.enrolledCount ?? 0);
    return {
      id: course.id,
      name: course.name,
      code: course.code,
      credits: course.credits,
      lecturer: course.lecturer,
      lecturer_id: course.lecturerId,
      capacity: course.capacity,
      faculty: course.faculty,
      description: course.description,
      created_at: course.createdAt,
      enrolled,
      remaining: course.capacity - enrolled,
    };
  }

  async listAssignedCourses(lecturerId: number) {
    const courses = await this.dataSource.getRepository(Course).createQueryBuilder('course')
      .loadRelationCountAndMap('course.enrolledCount', 'course.registrations')
      .where('course.lecturerId = :lecturerId', { lecturerId })
      .orderBy('course.code', 'ASC')
      .getMany();
    return courses.map((course) => this.mapAssignedCourse(course as CourseWithCount));
  }

  async assignCourses(lecturerId: number, courseIds: string[]) {
    await this.dataSource.transaction(async (manager) => {
      const findOptions: FindOneOptions<AuthUser> = { where: { id: lecturerId, role: 'lecturer' }, relations: { student: true } };
      if (this.dataSource.options.type === 'mysql') findOptions.lock = { mode: 'pessimistic_write' };
      const lecturer = await manager.getRepository(AuthUser).findOne(findOptions);
      if (!lecturer) throw Object.assign(new Error('LECTURER_NOT_FOUND'), { code: 'LECTURER_NOT_FOUND' });
      if (courseIds.length) {
        const total = await manager.count(Course, { where: { id: In(courseIds) } });
        if (total !== courseIds.length) {
          throw Object.assign(new Error('COURSE_NOT_FOUND'), { code: 'COURSE_NOT_FOUND' });
        }
      }
      await manager.getRepository(Course).update({ lecturerId }, { lecturerId: null });
      if (courseIds.length) {
        await manager.getRepository(Course).update(
          { id: In(courseIds) },
          { lecturerId, lecturer: lecturer.student.name },
        );
      }
    });
    return this.listAssignedCourses(lecturerId);
  }
}
