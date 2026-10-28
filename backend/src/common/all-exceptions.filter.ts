import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      const message = typeof payload === 'string'
        ? payload
        : Array.isArray((payload as any).message)
          ? (payload as any).message.join(', ')
          : (payload as any).message || exception.message;
      return response.status(status).json({ message });
    }
    console.error('Request failed:', exception);
    return response.status(500).json({ message: 'Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.' });
  }
}
