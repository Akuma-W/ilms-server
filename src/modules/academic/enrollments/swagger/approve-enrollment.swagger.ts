import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiApproveEnrollment() {
  return applyDecorators(
    ApiOperation({
      summary: 'Approve a student enrollment request (teacher/admin)',
    }),
    ApiAuth(),
    ApiParam({
      name: 'classId',
      description: 'Class UUID identifier',
      type: 'string',
    }),
    ApiParam({
      name: 'userId',
      description: 'Student User UUID identifier',
      type: 'string',
    }),
    ApiOkResponse({
      description: 'Enrollment approved successfully',
      schema: {
        example: {
          success: true,
          message: 'Approve enrollment successful',
          data: {
            id: 'enrollment-uuid',
            classId: 'class-uuid',
            userId: 'student-uuid',
            status: 'approved',
            joinedAt: '2026-03-19T10:00:00.000Z',
          },
        },
      },
    }),
  );
}
