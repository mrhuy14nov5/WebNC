import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 120 })
  name: string;

  @Index({ unique: true })
  @Column({ length: 180 })
  email: string;

  @Column({ length: 120 })
  major: string;

  @Column({ type: 'int' })
  year: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity('auth_users')
export class AuthUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'student_id', type: 'int', unique: true })
  studentId: number;

  @OneToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Index({ unique: true })
  @Column({ length: 180 })
  email: string;

  @Column({ name: 'password_hash', length: 128 })
  passwordHash: string;

  @Column({ name: 'password_salt', length: 32 })
  passwordSalt: string;

  @Column({ length: 20, default: 'student' })
  role: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Course, (course) => course.lecturerUser)
  assignedCourses: Course[];
}

@Entity('auth_sessions')
export class AuthSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @ManyToOne(() => AuthUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: AuthUser;

  @Index({ unique: true })
  @Column({ name: 'token_hash', length: 64 })
  tokenHash: string;

  @Column({ name: 'expires_at', type: 'bigint' })
  expiresAt: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity('courses')
export class Course {
  @PrimaryColumn({ type: 'varchar', length: 40 })
  id: string;

  @Column({ length: 180 })
  name: string;

  @Index({ unique: true })
  @Column({ length: 30 })
  code: string;

  @Column({ type: 'int' })
  credits: number;

  @Column({ length: 120 })
  lecturer: string;

  @Column({ name: 'lecturer_id', type: 'int', nullable: true })
  lecturerId: number | null;

  @ManyToOne(() => AuthUser, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'lecturer_id' })
  lecturerUser: AuthUser | null;

  @Column({ type: 'int' })
  capacity: number;

  @Column({ length: 120 })
  faculty: string;

  @Column({ type: 'text' })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => CourseRegistration, (registration) => registration.course)
  registrations: CourseRegistration[];
}

@Entity('course_registrations')
@Index(['studentId', 'courseId'], { unique: true })
export class CourseRegistration {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'student_id', type: 'int' })
  studentId: number;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ name: 'course_id', type: 'varchar', length: 40 })
  courseId: string;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
