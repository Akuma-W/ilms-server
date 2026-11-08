import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiRejectEnrollment() {
  return applyDecorators(
    ApiOperation({
      summary: 'Reject a student enrollment request (teacher/admin)',
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
      description: 'Enrollment rejected successfully',
      schema: {
        example: {
          success: true,
          message: 'Reject enrollment successful',
          data: {
            id: 'enrollment-uuid',
            classId: 'class-uuid',
            userId: 'student-uuid',
            status: 'rejected',
          },
        },
      },
    }),
  );
}
