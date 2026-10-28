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
import { isDuplicateCourseError } from '../common/database-errors';
import { validateCourse } from '../common/validators';
import { CourseDto } from './courses.dto';
import { CoursesService } from './courses.service';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiOperation({ summary: 'Tìm kiếm học phần theo tên, mã hoặc khoa' })
  list(@Query('search') search = '', @Query('faculty') faculty = '') {
    return this.coursesService.list({ search: String(search), faculty: String(faculty) });
  }

  @Post()
  @ApiCookieAuth('unimanage_session')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Admin tạo học phần' })
  async create(@Body() body: CourseDto) {
    const result = validateCourse(body, true);
    if (result.error) throw new BadRequestException(result.error);
    try {
      return await this.coursesService.create(result.course);
    } catch (error) {
      if (isDuplicateCourseError(error)) throw new ConflictException('Mã học phần hoặc mã môn học đã tồn tại.');
      throw error;
    }
  }

  @Put(':id')
  @ApiCookieAuth('unimanage_session')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Admin cập nhật học phần' })
  async update(@Param('id') id: string, @Body() body: CourseDto) {
    const result = validateCourse(body);
    if (result.error) throw new BadRequestException(result.error);
    try {
      const course = await this.coursesService.update(id, result.course);
      if (!course) throw new NotFoundException('Không tìm thấy học phần.');
      return course;
    } catch (error) {
      if (isDuplicateCourseError(error)) throw new ConflictException('Mã học phần hoặc mã môn học đã tồn tại.');
      if (error.code === 'COURSE_NOT_FOUND') throw new NotFoundException('Không tìm thấy học phần.');
      if (error.code === 'COURSE_CAPACITY_BELOW_ENROLLMENT') {
        throw new ConflictException('Sức chứa không thể thấp hơn số sinh viên đã đăng ký.');
      }
      throw error;
    }
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiCookieAuth('unimanage_session')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Admin xóa học phần chưa có đăng ký' })
  async remove(@Param('id') id: string) {
    try {
      await this.coursesService.remove(id);
    } catch (error) {
      if (error.code === 'COURSE_NOT_FOUND') throw new NotFoundException('Không tìm thấy học phần.');
      if (error.code === 'COURSE_HAS_REGISTRATIONS') {
        throw new ConflictException('Không thể xóa học phần đang có sinh viên đăng ký.');
      }
      throw error;
    }
  }

  @Get('mine')
  @ApiCookieAuth('unimanage_session')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('student')
  @ApiOperation({ summary: 'Sinh viên xem học phần đã đăng ký' })
  mine(@CurrentUser() user: PublicUser) {
    return this.coursesService.listRegistrations(user.id);
  }

  @Post(':id/register')
  @ApiCookieAuth('unimanage_session')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('student')
  @ApiOperation({ summary: 'Sinh viên đăng ký học phần' })
  async register(@CurrentUser() user: PublicUser, @Param('id') id: string) {
    try {
      await this.coursesService.registerForCourse(user.id, id);
      return { message: 'Đăng ký học phần thành công.' };
    } catch (error) {
      if (error.code === 'COURSE_NOT_FOUND') throw new NotFoundException('Không tìm thấy học phần.');
      if (error.code === 'COURSE_FULL') throw new ConflictException('Học phần đã đủ chỗ.');
      if (error.code === 'ALREADY_REGISTERED') throw new ConflictException('Bạn đã đăng ký học phần này.');
      throw error;
    }
  }

  @Delete(':id/register')
  @HttpCode(204)
  @ApiCookieAuth('unimanage_session')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('student')
  @ApiOperation({ summary: 'Sinh viên hủy đăng ký học phần' })
  async unregister(@CurrentUser() user: PublicUser, @Param('id') id: string) {
    const removed = await this.coursesService.unregisterFromCourse(user.id, id);
    if (!removed) throw new NotFoundException('Bạn chưa đăng ký học phần này.');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết học phần' })
  async detail(@Param('id') id: string) {
    const course = await this.coursesService.find(id);
    if (!course) throw new NotFoundException('Không tìm thấy học phần.');
    return course;
  }
}
