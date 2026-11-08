import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiLeaveClass() {
  return applyDecorators(
    ApiOperation({ summary: 'Student voluntarily leaves an enrolled class' }),
    ApiAuth(),
    ApiParam({
      name: 'classId',
      description: 'Class UUID identifier',
      type: 'string',
    }),
    ApiOkResponse({
      description: 'Successfully left the class',
      schema: {
        example: {
          success: true,
          message: 'Leave class successful',
        },
      },
    }),
  );
}
