import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { clearSessionCookie, issueCsrfToken, readSessionToken, setSessionCookie } from '../common/cookies';
import { isDuplicateEmailError } from '../common/database-errors';
import { validateCredentials } from '../common/validators';
import { LoginDto, RegisterDto } from './auth.dto';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('csrf')
  @ApiOperation({ summary: 'Lấy CSRF token và đặt cookie double-submit' })
  csrf(@Res({ passthrough: true }) response: Response) {
    return { csrfToken: issueCsrfToken(response) };
  }

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản sinh viên' })
  async register(@Body() body: RegisterDto, @Res({ passthrough: true }) response: Response) {
    const credentials = validateCredentials(body);
    const name = String(body?.name ?? '').trim();
    const major = String(body?.major ?? '').trim();
    const year = Number(body?.year);
    if (credentials.message) throw new BadRequestException(credentials.message);
    if (!name || name.length > 120 || !major || major.length > 120 || !Number.isInteger(year) || year < 1 || year > 6) {
      throw new BadRequestException('Vui lòng nhập họ tên, ngành học và năm học hợp lệ.');
    }
    try {
      const result = await this.authService.register({
        email: credentials.email as string,
        password: credentials.password as string,
        name,
        major,
        year,
      });
      setSessionCookie(response, result.token);
      return { user: result.user };
    } catch (error) {
      if (isDuplicateEmailError(error)) throw new ConflictException('Email này đã được đăng ký.');
      throw error;
    }
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Đăng nhập bằng email và mật khẩu' })
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) response: Response) {
    const credentials = validateCredentials(body);
    if (credentials.message) throw new BadRequestException(credentials.message);
    const result = await this.authService.login(credentials.email, credentials.password);
    if (!result) throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    setSessionCookie(response, result.token);
    return { user: result.user };
  }

  @Get('me')
  @ApiOperation({ summary: 'Lấy hồ sơ người dùng hiện tại từ cookie phiên' })
  async me(@Req() request: Request) {
    return { user: await this.authService.currentUser(readSessionToken(request)) };
  }

  @Post('logout')
  @HttpCode(204)
  @ApiOperation({ summary: 'Đăng xuất và thu hồi phiên hiện tại' })
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const token = readSessionToken(request);
    if (token) await this.authService.deleteSession(token);
    clearSessionCookie(response);
  }
}
