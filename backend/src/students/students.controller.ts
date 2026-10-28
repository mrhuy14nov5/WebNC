import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { isDuplicateEmailError } from '../common/database-errors';
import { validateStudent } from '../common/validators';
import { StudentDto } from './students.dto';
import { StudentsService } from './students.service';

@ApiTags('Students')
@ApiCookieAuth('unimanage_session')
@Controller('students')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @ApiOperation({ summary: 'Admin tìm kiếm danh sách sinh viên' })
  list(@Query('search') search = '') {
    return this.studentsService.list(search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin xem hồ sơ một sinh viên' })
  async detail(@Param('id') id: string) {
    const student = await this.studentsService.find(Number(id));
    if (!student) throw new NotFoundException('Không tìm thấy sinh viên.');
    return student;
  }

  @Post()
  @ApiOperation({ summary: 'Admin tạo hồ sơ sinh viên' })
  async create(@Body() body: StudentDto) {
    const result = validateStudent(body);
    if (result.error) throw new BadRequestException(result.error);
    try {
      return await this.studentsService.create(result.student);
    } catch (error) {
      if (isDuplicateEmailError(error)) throw new ConflictException('Email này đã được sử dụng.');
      throw error;
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Admin cập nhật hồ sơ sinh viên và email đăng nhập' })
  async update(@Param('id') id: string, @Body() body: StudentDto) {
    const result = validateStudent(body);
    if (result.error) throw new BadRequestException(result.error);
    try {
      const student = await this.studentsService.update(Number(id), result.student);
      if (!student) throw new NotFoundException('Không tìm thấy sinh viên.');
      return student;
    } catch (error) {
      if (isDuplicateEmailError(error)) throw new ConflictException('Email này đã được sử dụng.');
      throw error;
    }
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Admin xóa hồ sơ sinh viên' })
  async remove(@Param('id') id: string) {
    const removed = await this.studentsService.remove(Number(id));
    if (!removed) throw new NotFoundException('Không tìm thấy sinh viên.');
  }
}
