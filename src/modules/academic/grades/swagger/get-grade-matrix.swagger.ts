import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { ClassGradeMatrixEntity } from '../entities/grade-matrix.entity';

export function ApiGetGradeMatrix() {
  return applyDecorators(
    ApiOperation({
      summary:
        'Get full classroom grade matrix and analytics (teachers/admins only)',
    }),
    ApiAuth(),
    ApiParam({
      name: 'classId',
      description: 'UUID of the class',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiOkResponse({
      description: 'Classroom grade matrix retrieved successfully',
      type: ClassGradeMatrixEntity,
    }),
  );
}
