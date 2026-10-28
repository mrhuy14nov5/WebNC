import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuthUser, Student } from '../database/entities';

function escapeLike(search: string) {
  return search.replace(/[\\%_]/g, '\\$&');
}

@Injectable()
export class StudentsService {
  constructor(private readonly dataSource: DataSource) {}

  private get students() {
    return this.dataSource.getRepository(Student);
  }

  async list(search = '') {
    const query = this.students.createQueryBuilder('student')
      .leftJoin(AuthUser, 'user', 'user.studentId = student.id')
      .where('(user.role IS NULL OR user.role = :studentRole)', { studentRole: 'student' });
    if (search) {
      const escapeClause = this.dataSource.options.type === 'mysql' ? "ESCAPE '\\\\'" : "ESCAPE '\\'";
      query.andWhere(`(student.name LIKE :value ${escapeClause} OR student.email LIKE :value ${escapeClause} OR student.major LIKE :value ${escapeClause})`, {
        value: `%${escapeLike(search)}%`,
      });
    }
    return query.orderBy('student.createdAt', 'DESC').getMany();
  }

  find(id: number) {
    return this.students.findOneBy({ id });
  }

  async create(student: Partial<Student>) {
    return this.students.save(student);
  }

  async update(id: number, student: Partial<Student>) {
    return this.dataSource.transaction(async (manager) => {
      const studentRepository = manager.getRepository(Student);
      const existing = await studentRepository.findOneBy({ id });
      if (!existing) return null;
      await studentRepository.update(id, {
        name: student.name,
        email: student.email,
        major: student.major,
        year: student.year,
      });
      await manager.getRepository(AuthUser).update({ studentId: id }, { email: student.email });
      return studentRepository.findOneBy({ id });
    });
  }

  async remove(id: number) {
    const existing = await this.students.findOneBy({ id });
    if (!existing) return false;
    await this.students.delete(id);
    return true;
  }
}
