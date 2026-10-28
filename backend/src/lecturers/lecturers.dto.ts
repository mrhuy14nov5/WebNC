import { ApiProperty } from '@nestjs/swagger';

export class LecturerDto {
  @ApiProperty({ example: 'ThS. Nguyễn Minh Anh' })
  name: string;

  @ApiProperty({ example: 'lecturer@example.edu' })
  email: string;

  @ApiProperty({ example: 'Công nghệ thông tin' })
  faculty: string;

  @ApiProperty({ example: 'Lecturer-Password-2026', required: false, minLength: 8, maxLength: 128 })
  password?: string;
}

export class AssignCoursesDto {
  @ApiProperty({ example: ['web-301', 'data-210'], type: [String] })
  courseIds: string[];
}
