import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { readSessionToken } from '../common/cookies';
import { AuthService, PublicUser } from './auth.service';

export interface AuthenticatedRequest extends Request {
  user?: PublicUser;
  sessionToken?: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = readSessionToken(request);
    if (!token) throw new UnauthorizedException('Vui lòng đăng nhập để tiếp tục.');
    const user = await this.authService.findUserForSession(token);
    if (!user) throw new UnauthorizedException('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    request.user = user;
    request.sessionToken = token;
    return true;
  }
}
