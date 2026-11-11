import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiDeleteGradeCategory() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a grade category from the classroom' }),
    ApiAuth(),
    ApiParam({
      name: 'classId',
      description: 'UUID of the class',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiParam({
      name: 'categoryId',
      description: 'UUID of the grade category',
      example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    ApiOkResponse({
      description: 'Grade category deleted successfully',
      schema: {
        example: {
          success: true,
          message: 'Grade category deleted successfully',
        },
      },
    }),
  );
}
