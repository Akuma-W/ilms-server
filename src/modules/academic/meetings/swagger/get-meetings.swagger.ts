import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MeetingSessionEntity } from '../entities/meeting-session.entity';

export function ApiGetClassMeetings() {
  return applyDecorators(
    ApiOperation({
      summary: 'Retrieve all meeting sessions for a classroom',
      description:
        'Returns chronological list of scheduled and concluded video sessions with attendance metrics.',
    }),
    ApiResponse({
      status: 200,
      description: 'List of classroom meeting sessions',
      type: [MeetingSessionEntity],
    }),
  );
}
