import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MeetingSessionEntity } from '../entities/meeting-session.entity';

export function ApiGetMeetingDetail() {
  return applyDecorators(
    ApiOperation({
      summary: 'Retrieve detailed information of a meeting session',
      description:
        'Returns meeting session metadata, active status and review recording URL.',
    }),
    ApiResponse({
      status: 200,
      description: 'Meeting session detail retrieved',
      type: MeetingSessionEntity,
    }),
    ApiResponse({
      status: 404,
      description: 'Meeting session not found',
    }),
  );
}
