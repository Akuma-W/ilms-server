import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LiveKitProvider } from './providers/livekit.provider';
import { MeetingFacade } from './meeting.facade';

@Module({
  imports: [ConfigModule],
  providers: [LiveKitProvider, MeetingFacade],
  exports: [MeetingFacade],
})
export class MeetingModule {}
