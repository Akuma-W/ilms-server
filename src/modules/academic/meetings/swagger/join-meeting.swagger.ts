import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MeetingTokenResponseEntity } from '../entities/meeting-token-response.entity';

export function ApiJoinMeetingSession() {
  return applyDecorators(
    ApiOperation({
      summary: 'Join meeting session gateway (auto-attendance & LiveKit token)',
      description:
        'Verifies classroom enrollment, logs attendance record for student, and generates LiveKit JWT token.',
    }),
    ApiResponse({
      status: 200,
      description: 'Attendance logged and LiveKit token granted',
      type: MeetingTokenResponseEntity,
    }),
    ApiResponse({
      status: 400,
      description: 'Meeting session is not active or enrollment not approved',
    }),
    ApiResponse({
      status: 404,
      description: 'Meeting session not found',
    }),
  );
}
