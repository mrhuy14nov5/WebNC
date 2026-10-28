import { ApiProperty } from '@nestjs/swagger';

export class StudentDto {
  @ApiProperty({ example: 'Nguyễn Văn An' })
  name: string;

  @ApiProperty({ example: 'student@example.edu' })
  email: string;

  @ApiProperty({ example: 'Công nghệ thông tin' })
  major: string;

  @ApiProperty({ example: 2, minimum: 1, maximum: 6 })
  year: number;
}
