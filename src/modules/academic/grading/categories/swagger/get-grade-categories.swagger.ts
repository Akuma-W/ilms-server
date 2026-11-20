import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { GradeCategoryEntity } from '../entities/grade-category.entity';

export function ApiGetGradeCategories() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all grade categories and weights for a classroom',
    }),
    ApiAuth(),
    ApiParam({
      name: 'classId',
      description: 'UUID of the class',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiOkResponse({
      description: 'List of grade categories retrieved successfully',
      type: [GradeCategoryEntity],
    }),
  );
}
