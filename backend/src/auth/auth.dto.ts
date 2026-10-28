import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Nguyễn Văn An', maxLength: 120 })
  name: string;

  @ApiProperty({ example: 'student@example.edu', maxLength: 180 })
  email: string;

  @ApiProperty({ example: 'Công nghệ thông tin', maxLength: 120 })
  major: string;

  @ApiProperty({ example: 2, minimum: 1, maximum: 6 })
  year: number;

  @ApiProperty({ example: 'Student-Password-2026', minLength: 8, maxLength: 128 })
  password: string;
}

export class LoginDto {
  @ApiProperty({ example: 'student@example.edu' })
  email: string;

  @ApiProperty({ example: 'Student-Password-2026' })
  password: string;
}

export class PublicUserDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  major: string;

  @ApiProperty()
  year: number;

  @ApiProperty({ enum: ['student', 'lecturer', 'admin'] })
  role: string;
}
