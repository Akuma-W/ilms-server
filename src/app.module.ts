import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { RolesGuard } from './common/guards/roles.guard';
import { CustomThrottlerGuard } from './common/guards/throttler.guard';
import { JwtAuthGuard } from './modules/auth/session/guards/jwt-auth.guard';
import { PrismaModule } from './infrastructures/prisma/prisma.module';
import { RedisModule } from './infrastructures/redis/redis.module';
import { StorageModule } from './infrastructures/storage/storage.module';
import { NotificationModule } from './infrastructures/notification/notification.module';
import { HealthModule } from './health/health.module';
import { LoggerModule } from './logger/logger.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { AcademicModule } from './modules/academic/academic.module';
import { LearningModule } from './modules/learning/learning.module';
import { AssignModule } from './modules/assign/assign.module';
import { ForumModule } from './modules/forum/forum.module';
import { QuizModule } from './modules/quiz/quiz.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short', // burst
        ttl: 10,
        limit: 20,
      },
      {
        name: 'long', // sustained
        ttl: 60,
        limit: 100,
      },
    ]),
    PrismaModule,
    RedisModule,
    StorageModule,
    NotificationModule,
    HealthModule,
    LoggerModule,
    UsersModule,
    AuthModule,
    AcademicModule,
    LearningModule,
    AssignModule,
    ForumModule,
    QuizModule,
    AdminModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}
