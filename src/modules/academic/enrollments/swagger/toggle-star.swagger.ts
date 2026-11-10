import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiToggleStar() {
  return applyDecorators(
    ApiOperation({ summary: 'Toggle star favorite status of an enrollment' }),
    ApiAuth(),
    ApiParam({
      name: 'id',
      description: 'Enrollment UUID identifier',
      type: 'string',
    }),
    ApiOkResponse({
      description: 'Updated enrollment with toggled isStarred value',
      schema: {
        example: {
          success: true,
          message: 'Toggle star success',
          data: {
            id: 'enrollment-uuid',
            classId: 'class-uuid',
            userId: 'user-uuid',
            isStarred: true,
          },
        },
      },
    }),
  );
}
