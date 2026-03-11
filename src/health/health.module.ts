import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { HttpModule } from '@nestjs/axios';
import { RedisModule } from 'src/infrastructures/redis/redis.module';

@Module({
  imports: [TerminusModule, HttpModule, RedisModule],
  controllers: [HealthController],
})
export class HealthModule {}
