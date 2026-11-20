import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MeetingSessionEntity } from '../entities/meeting-session.entity';

export function ApiUpdateMeetingSession() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update meeting session details',
      description:
        'Allows class teacher or admin to update scheduled meeting title, description, or start time.',
    }),
    ApiResponse({
      status: 200,
      description: 'Meeting session successfully updated',
      type: MeetingSessionEntity,
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden: Only class teacher can update meeting session',
    }),
    ApiResponse({
      status: 404,
      description: 'Meeting session not found',
    }),
  );
}
