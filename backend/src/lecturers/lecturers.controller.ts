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
import { CurrentUser } from '../auth/current-user.decorator';
import { PublicUser } from '../auth/auth.service';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { isDuplicateEmailError } from '../common/database-errors';
import { validateCourseIds, validateLecturer } from '../common/validators';
import { AssignCoursesDto, LecturerDto } from './lecturers.dto';
import { LecturersService } from './lecturers.service';

@ApiTags('Lecturers')
@ApiCookieAuth('unimanage_session')
@Controller('lecturers')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class LecturersController {
  constructor(private readonly lecturersService: LecturersService) {}

  @Get('me/courses')
  @Roles('lecturer')
  @ApiOperation({ summary: 'Giảng viên xem học phần được phân công' })
  myCourses(@CurrentUser() user: PublicUser) {
    return this.lecturersService.listAssignedCourses(user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Admin tìm kiếm danh sách giảng viên' })
  list(@Query('search') search = '') {
    return this.lecturersService.list(String(search));
  }

  @Post()
  @ApiOperation({ summary: 'Admin tạo tài khoản giảng viên' })
  async create(@Body() body: LecturerDto) {
    const result = validateLecturer(body);
    if (result.error) throw new BadRequestException(result.error);
    try {
      return await this.lecturersService.create(result.lecturer);
    } catch (error) {
      if (isDuplicateEmailError(error)) throw new ConflictException('Email này đã được sử dụng.');
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin xem chi tiết giảng viên' })
  async detail(@Param('id') id: string) {
    const lecturer = await this.lecturersService.find(Number(id));
    if (!lecturer) throw new NotFoundException('Không tìm thấy giảng viên.');
    return lecturer;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Admin cập nhật tài khoản giảng viên' })
  async update(@Param('id') id: string, @Body() body: LecturerDto) {
    const result = validateLecturer(body, { requirePassword: false });
    if (result.error) throw new BadRequestException(result.error);
    try {
      const lecturer = await this.lecturersService.update(Number(id), result.lecturer);
      if (!lecturer) throw new NotFoundException('Không tìm thấy giảng viên.');
      return lecturer;
    } catch (error) {
      if (isDuplicateEmailError(error)) throw new ConflictException('Email này đã được sử dụng.');
      throw error;
    }
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Admin xóa tài khoản giảng viên' })
  async remove(@Param('id') id: string) {
    const removed = await this.lecturersService.remove(Number(id));
    if (!removed) throw new NotFoundException('Không tìm thấy giảng viên.');
  }

  @Get(':id/courses')
  @ApiOperation({ summary: 'Admin xem học phần được phân công cho giảng viên' })
  async assignedCourses(@Param('id') id: string) {
    const lecturer = await this.lecturersService.find(Number(id));
    if (!lecturer) throw new NotFoundException('Không tìm thấy giảng viên.');
    return this.lecturersService.listAssignedCourses(Number(id));
  }

  @Put(':id/courses')
  @ApiOperation({ summary: 'Admin phân công học phần cho giảng viên' })
  async assign(@Param('id') id: string, @Body() body: AssignCoursesDto) {
    const result = validateCourseIds(body);
    if (result.error) throw new BadRequestException(result.error);
    try {
      return await this.lecturersService.assignCourses(Number(id), result.courseIds);
    } catch (error) {
      if (error.code === 'LECTURER_NOT_FOUND') throw new NotFoundException('Không tìm thấy giảng viên.');
      if (error.code === 'COURSE_NOT_FOUND') throw new BadRequestException('Một học phần trong danh sách không tồn tại.');
      throw error;
    }
  }
}
