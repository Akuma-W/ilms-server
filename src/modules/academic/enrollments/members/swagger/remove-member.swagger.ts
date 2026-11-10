import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiRemoveMember() {
  return applyDecorators(
    ApiOperation({ summary: 'Remove a member from class' }),
    ApiAuth(),
    ApiParam({
      name: 'classId',
      description: 'Class UUID identifier',
      type: 'string',
    }),
    ApiParam({
      name: 'memberId',
      description: 'Enrollment ID or User ID',
      type: 'string',
    }),
    ApiOkResponse({
      description: 'Member removed successfully',
      schema: {
        example: {
          success: true,
          message: 'Remove member successful',
        },
      },
    }),
  );
}
