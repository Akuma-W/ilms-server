import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { UpdateEnrollmentDto } from '../dto/update-enrollment.dto';

export function ApiUpdateEnrollment() {
  return applyDecorators(
    ApiOperation({ summary: 'Update an enrollment record (teacher/admin)' }),
    ApiAuth(),
    ApiParam({
      name: 'classId',
      description: 'Class UUID identifier',
      type: 'string',
    }),
    ApiParam({
      name: 'userId',
      description: 'Target User UUID identifier',
      type: 'string',
    }),
    ApiBody({ type: UpdateEnrollmentDto }),
    ApiOkResponse({
      description: 'Enrollment updated successfully',
      schema: {
        example: {
          success: true,
          message: 'Update enrollment successful',
          data: {
            id: 'enrollment-uuid',
            classId: 'class-uuid',
            userId: 'student-uuid',
            roleIn: 'student',
            status: 'approved',
          },
        },
      },
    }),
  );
}
