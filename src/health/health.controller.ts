import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from 'src/common/decorators/public.decorator';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { RedisService } from 'src/infrastructures/redis/redis.service';

@Public()
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  @Get('live')
  live() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date(),
    };
  }

  @Get('ready')
  @HealthCheck()
  async ready() {
    return this.health.check([
      async () => {
        await this.prisma.$queryRaw`SELECT 1`;
        return {
          database: { status: 'up' },
        };
      },
      async () => {
        const pong = await this.redis.getClient().ping();
        if (pong !== 'PONG') {
          throw new Error('Redis not responding');
        }
        return { redis: { status: 'up' } };
      },
    ]);
  }
}
