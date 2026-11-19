import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MeetingSessionEntity } from '../entities/meeting-session.entity';

export function ApiCreateMeeting() {
  return applyDecorators(
    ApiOperation({
      summary: 'Schedule a new virtual classroom meeting session',
      description:
        'Allows class teacher to schedule a live video session, generate LiveKit room and optionally email all students.',
    }),
    ApiResponse({
      status: 201,
      description: 'Meeting session successfully scheduled',
      type: MeetingSessionEntity,
    }),
    ApiResponse({
      status: 400,
      description: 'Validation failed or invalid start timestamp',
    }),
    ApiResponse({
      status: 404,
      description: 'Class not found',
    }),
  );
}
