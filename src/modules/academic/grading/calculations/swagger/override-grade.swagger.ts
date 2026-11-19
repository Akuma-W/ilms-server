import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiOverrideGrade() {
  return applyDecorators(
    ApiOperation({
      summary: 'Manually override or adjust student grade for a category',
      description:
        'Allows class teacher to override raw calculated score with audit reason while preserving original score history.',
    }),
    ApiResponse({
      status: 200,
      description: 'Grade successfully overridden',
    }),
    ApiResponse({
      status: 404,
      description: 'Grade category or student enrollment not found',
    }),
  );
}
