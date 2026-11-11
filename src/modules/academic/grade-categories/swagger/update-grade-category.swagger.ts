import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { UpdateGradeCategoryDto } from '../dto/update-grade-category.dto';
import { GradeCategoryEntity } from '../entities/grade-category.entity';

export function ApiUpdateGradeCategory() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update an existing grade category name or weight',
    }),
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
    ApiBody({ type: UpdateGradeCategoryDto }),
    ApiOkResponse({
      description: 'Grade category updated successfully',
      type: GradeCategoryEntity,
    }),
  );
}
