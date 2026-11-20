import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiTrackMaterialProgress() {
  return applyDecorators(
    ApiOperation({
      summary: 'Track student material reading and completion progress',
    }),
    ApiAuth(),
    ApiOkResponse({
      description: 'Material progress recorded successfully',
      schema: {
        example: {
          success: true,
          message: 'Track material progress successful',
          data: {
            id: 'uuid',
            isCompleted: true,
            lastViewedAt: '2026-11-19T00:00:00.000Z',
            materialId: 'uuid',
            studentId: 'uuid',
          },
        },
      },
    }),
    ApiNotFoundResponse({ description: 'Material not found' }),
  );
}
