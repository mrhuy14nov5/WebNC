import { Injectable } from '@nestjs/common';
import { DataSource, FindOneOptions } from 'typeorm';
import { AuthUser, Course, CourseRegistration } from '../database/entities';

function escapeLike(search: string) {
  return search.replace(/[\\%_]/g, '\\$&');
}

type CourseWithCount = Course & { enrolledCount?: number };

@Injectable()
export class CoursesService {
  constructor(private readonly dataSource: DataSource) {}

  private get courses() {
    return this.dataSource.getRepository(Course);
  }

  private mapCourse(course: CourseWithCount) {
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

  async list({ search = '', faculty = '' }: { search?: string; faculty?: string } = {}) {
    const query = this.courses.createQueryBuilder('course')
      .loadRelationCountAndMap('course.enrolledCount', 'course.registrations');
    if (search) {
      const escapeClause = this.dataSource.options.type === 'mysql' ? "ESCAPE '\\\\'" : "ESCAPE '\\'";
      query.andWhere(`(course.name LIKE :value ${escapeClause} OR course.code LIKE :value ${escapeClause} OR course.faculty LIKE :value ${escapeClause})`, {
        value: `%${escapeLike(search)}%`,
      });
    }
    if (faculty) query.andWhere('course.faculty = :faculty', { faculty });
    const courses = await query.orderBy('course.code', 'ASC').getMany();
    return courses.map((course) => this.mapCourse(course as CourseWithCount));
  }

  async find(id: string) {
    const course = await this.courses.createQueryBuilder('course')
      .loadRelationCountAndMap('course.enrolledCount', 'course.registrations')
      .where('course.id = :id', { id })
      .getOne();
    return course ? this.mapCourse(course as CourseWithCount) : null;
  }

  async create(course: Partial<Course>) {
    await this.courses.insert(course);
    return this.find(course.id);
  }

  async update(id: string, course: Partial<Course>) {
    await this.dataSource.transaction(async (manager) => {
      const findOptions: FindOneOptions<Course> = { where: { id } };
      if (this.dataSource.options.type === 'mysql') findOptions.lock = { mode: 'pessimistic_write' };
      const existing = await manager.getRepository(Course).findOne(findOptions);
      if (!existing) throw Object.assign(new Error('COURSE_NOT_FOUND'), { code: 'COURSE_NOT_FOUND' });
      const total = await manager.count(CourseRegistration, { where: { courseId: id } });
      if (course.capacity < total) {
        throw Object.assign(new Error('COURSE_CAPACITY_BELOW_ENROLLMENT'), { code: 'COURSE_CAPACITY_BELOW_ENROLLMENT' });
      }
      await manager.getRepository(Course).update(id, {
        name: course.name,
        code: course.code,
        credits: course.credits,
        lecturer: course.lecturer,
        capacity: course.capacity,
        faculty: course.faculty,
        description: course.description,
      });
    });
    return this.find(id);
  }

  async remove(id: string) {
    await this.dataSource.transaction(async (manager) => {
      const existing = await manager.getRepository(Course).findOneBy({ id });
      if (!existing) throw Object.assign(new Error('COURSE_NOT_FOUND'), { code: 'COURSE_NOT_FOUND' });
      const total = await manager.count(CourseRegistration, { where: { courseId: id } });
      if (total > 0) throw Object.assign(new Error('COURSE_HAS_REGISTRATIONS'), { code: 'COURSE_HAS_REGISTRATIONS' });
      await manager.delete(Course, id);
    });
    return true;
  }

  async registerForCourse(userId: number, courseId: string) {
    await this.dataSource.transaction(async (manager) => {
      const user = await manager.getRepository(AuthUser).findOneBy({ id: userId });
      const findOptions: FindOneOptions<Course> = { where: { id: courseId } };
      if (this.dataSource.options.type === 'mysql') findOptions.lock = { mode: 'pessimistic_write' };
      const course = await manager.getRepository(Course).findOne(findOptions);
      if (!course) throw Object.assign(new Error('COURSE_NOT_FOUND'), { code: 'COURSE_NOT_FOUND' });
      const existing = await manager.getRepository(CourseRegistration).findOneBy({ studentId: user.studentId, courseId });
      if (existing) throw Object.assign(new Error('ALREADY_REGISTERED'), { code: 'ALREADY_REGISTERED' });
      const total = await manager.count(CourseRegistration, { where: { courseId } });
      if (total >= course.capacity) throw Object.assign(new Error('COURSE_FULL'), { code: 'COURSE_FULL' });
      await manager.insert(CourseRegistration, { studentId: user.studentId, courseId });
    });
    return true;
  }

  async listRegistrations(userId: number) {
    const user = await this.dataSource.getRepository(AuthUser).findOneBy({ id: userId });
    if (!user) return [];
    const registrations = await this.dataSource.getRepository(CourseRegistration)
      .createQueryBuilder('registration')
      .innerJoinAndSelect('registration.course', 'course')
      .where('registration.studentId = :studentId', { studentId: user.studentId })
      .orderBy('registration.createdAt', 'DESC')
      .getMany();
    return registrations.map((registration) => ({
      id: registration.course.id,
      name: registration.course.name,
      code: registration.course.code,
      credits: registration.course.credits,
      lecturer: registration.course.lecturer,
      faculty: registration.course.faculty,
      registered_at: registration.createdAt,
    }));
  }

  async unregisterFromCourse(userId: number, courseId: string) {
    const user = await this.dataSource.getRepository(AuthUser).findOneBy({ id: userId });
    if (!user) return 0;
    const result = await this.dataSource.getRepository(CourseRegistration)
      .delete({ studentId: user.studentId, courseId });
    return result.affected ?? 0;
  }
}
