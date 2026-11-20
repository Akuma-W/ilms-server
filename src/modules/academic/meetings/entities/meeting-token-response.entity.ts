import { ApiProperty } from '@nestjs/swagger';
import { MeetingSessionEntity } from './meeting-session.entity';

export class MeetingTokenResponseEntity {
  @ApiProperty({
    description: 'Signed LiveKit JWT access token allowing room connection',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sample-token',
    type: 'string',
  })
  token!: string;

  @ApiProperty({
    description: 'LiveKit server WebSocket gateway endpoint',
    example: 'wss://interactive-lms.livekit.cloud',
    type: 'string',
  })
  serverUrl!: string;

  @ApiProperty({
    description: 'Target room identifier',
    example: 'class-c1111111-session-1',
    type: 'string',
  })
  roomName!: string;

  @ApiProperty({
    description: 'Associated meeting session details',
    type: MeetingSessionEntity,
  })
  session!: MeetingSessionEntity;
}
