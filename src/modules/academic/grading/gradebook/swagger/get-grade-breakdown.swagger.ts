import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GradeCategoryBreakdownEntity } from '../entities/grade-category-breakdown.entity';

export function ApiGetGradeBreakdown() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get component item breakdown contributing to a grade category',
      description:
        'Returns granular sub-scores (individual assignments, quizzes, attendance checklist) and calculation strategy.',
    }),
    ApiResponse({
      status: 200,
      description: 'Grade breakdown retrieved successfully',
      type: GradeCategoryBreakdownEntity,
    }),
    ApiResponse({
      status: 404,
      description: 'Grade category not found',
    }),
  );
}
