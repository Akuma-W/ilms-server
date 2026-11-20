import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiGetMyMaterialProgress() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get current student material progress in classroom',
    }),
    ApiAuth(),
    ApiOkResponse({
      description: 'List of student material progress records',
      schema: {
        example: {
          success: true,
          message: 'Get my material progress successful',
          data: [
            {
              materialId: 'uuid',
              isCompleted: true,
              lastViewedAt: '2026-11-19T00:00:00.000Z',
            },
          ],
        },
      },
    }),
  );
}
