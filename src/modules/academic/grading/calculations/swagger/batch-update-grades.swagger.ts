import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { BatchUpdateGradesDto } from '../dto/batch-update-grades.dto';

export function ApiBatchUpdateGrades() {
  return applyDecorators(
    ApiOperation({
      summary:
        'Batch save or update student grades across categories (teachers/admins only)',
    }),
    ApiAuth(),
    ApiParam({
      name: 'classId',
      description: 'UUID of the class',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiBody({ type: BatchUpdateGradesDto }),
    ApiOkResponse({
      description: 'Batch grades updated successfully',
      schema: {
        example: {
          success: true,
          message: 'Batch grades updated successfully',
          count: 5,
        },
      },
    }),
  );
}
