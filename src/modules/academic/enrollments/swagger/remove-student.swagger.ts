import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiRemoveStudent() {
  return applyDecorators(
    ApiOperation({ summary: 'Teacher removes a student from class' }),
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
      description: 'Student removed successfully',
      schema: {
        example: {
          success: true,
          message: 'Remove student successful',
        },
      },
    }),
  );
}
