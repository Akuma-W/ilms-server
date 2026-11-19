import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MeetingAttendanceEntity } from '../entities/meeting-attendance.entity';

export function ApiGetMeetingAttendances() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get list of students who attended this meeting session',
      description:
        'Returns detailed attendance records with student identity and timestamp for grading.',
    }),
    ApiResponse({
      status: 200,
      description: 'Attendance list retrieved successfully',
      type: [MeetingAttendanceEntity],
    }),
    ApiResponse({
      status: 404,
      description: 'Meeting session not found',
    }),
  );
}
