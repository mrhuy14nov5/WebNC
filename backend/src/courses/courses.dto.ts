import { ApiProperty } from '@nestjs/swagger';

export class CourseDto {
  @ApiProperty({ example: 'web-301' })
  id: string;

  @ApiProperty({ example: 'Phát triển ứng dụng Web nâng cao' })
  name: string;

  @ApiProperty({ example: 'WEB301' })
  code: string;

  @ApiProperty({ example: 3 })
  credits: number;

  @ApiProperty({ example: 'ThS. Nguyễn Minh Anh' })
  lecturer: string;

  @ApiProperty({ example: 32 })
  capacity: number;

  @ApiProperty({ example: 'Công nghệ thông tin' })
  faculty: string;

  @ApiProperty({ example: 'Thiết kế và phát triển ứng dụng web hiện đại.' })
  description: string;
}
