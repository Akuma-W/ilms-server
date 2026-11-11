import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { CreateGradeCategoryDto } from '../dto/create-grade-category.dto';
import { GradeCategoryEntity } from '../entities/grade-category.entity';

export function ApiCreateGradeCategory() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a new grade category with weight percentage',
    }),
    ApiAuth(),
    ApiParam({
      name: 'classId',
      description: 'UUID of the class',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiBody({ type: CreateGradeCategoryDto }),
    ApiOkResponse({
      description: 'Grade category created successfully',
      type: GradeCategoryEntity,
    }),
  );
}
