import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  // Dùng cho Oneshield / uptime monitor / docker healthcheck.
  // Trả HTTP 200 khi process còn sống VÀ kết nối được database.
  // Trả HTTP 503 (không phải 200) khi DB lỗi, để bất kỳ công cụ nào
  // check bằng status code (curl -f, docker healthcheck, uptime bot)
  // đều phát hiện đúng là origin đang có vấn đề — thay vì chỉ phát
  // hiện qua báo cáo người dùng như hiện tại.
  @Get('health')
  async health() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', db: 'up', time: new Date().toISOString() };
    } catch (err) {
      throw new HttpException(
        {
          status: 'error',
          db: 'down',
          message: err instanceof Error ? err.message : 'unknown error',
          time: new Date().toISOString(),
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
