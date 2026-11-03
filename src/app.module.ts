import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { RolesGuard } from './common/guards/roles.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './infrastructures/prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RedisModule } from './infrastructures/redis/redis.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggerModule } from './logger/logger.module';
import { StorageModule } from './infrastructures/storage/storage.module';
import { ClassesModule } from './modules/classes/classes.module';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';
import { TopicsModule } from './modules/topics/topics.module';
import { SchoolsModule } from './modules/schools/schools.module';
import { CustomThrottlerGuard } from './common/guards/throttler.guard';
import { MaterialsModule } from './modules/materials/materials.module';
import { NotificationModule } from './infrastructures/notification/notification.module';

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
    HealthModule,
    PrismaModule,
    RedisModule,
    LoggerModule,
    StorageModule,
    NotificationModule,
    UsersModule,
    AuthModule,
    ClassesModule,
    EnrollmentsModule,
    TopicsModule,
    SchoolsModule,
    MaterialsModule,
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
