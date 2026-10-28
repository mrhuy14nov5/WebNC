import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  @ApiOperation({ summary: 'Kiểm tra trạng thái ứng dụng và cơ sở dữ liệu' })
  async check() {
    try {
      await this.dataSource.query('SELECT 1');
      const database = this.dataSource.options.type === 'mysql' ? 'connected' : 'local-sqlite';
      return { status: 'ok', database };
    } catch {
      throw new ServiceUnavailableException({ status: 'degraded', database: 'unavailable' });
    }
  }
}
