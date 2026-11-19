import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiCalculateAttendance() {
  return applyDecorators(
    ApiOperation({
      summary:
        'Automatically calculate attendance grades from material and meeting progress',
    }),
    ApiAuth(),
    ApiOkResponse({
      description: 'Attendance grades calculated and updated successfully',
      schema: {
        example: {
          success: true,
          message: 'Attendance grades calculated successfully',
          data: {
            categoryId: 'uuid',
            categoryName: 'Attendance',
            updatedCount: 25,
          },
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Class or attendance category not found',
    }),
  );
}
