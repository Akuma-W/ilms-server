import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MeetingSessionEntity } from '../entities/meeting-session.entity';

export function ApiCloseMeetingSession() {
  return applyDecorators(
    ApiOperation({
      summary: 'Conclude a meeting session and save review recording',
      description:
        'Allows teacher to mark session as closed and optionally save recording URL for student review.',
    }),
    ApiResponse({
      status: 200,
      description: 'Session successfully concluded',
      type: MeetingSessionEntity,
    }),
    ApiResponse({
      status: 404,
      description: 'Meeting session not found',
    }),
  );
}
