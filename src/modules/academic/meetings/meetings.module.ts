import { Module } from '@nestjs/common';
import { MeetingModule as InfraMeetingModule } from 'src/infrastructures/meeting/meeting.module';
import { NotificationModule } from 'src/infrastructures/notification/notification.module';
import { PrismaModule } from 'src/infrastructures/prisma/prisma.module';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';

@Module({
  imports: [PrismaModule, InfraMeetingModule, NotificationModule],
  controllers: [MeetingsController],
  providers: [MeetingsService],
  exports: [MeetingsService],
})
export class MeetingsModule {}
