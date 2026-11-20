import { applyDecorators } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { GradeRecordEntity } from '../entities/grade-record.entity';

export function ApiGetGradeRecord() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get detailed personal grade record for a student',
    }),
    ApiAuth(),
    ApiParam({
      name: 'classId',
      description: 'UUID of the class',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiQuery({
      name: 'studentId',
      description:
        'Optional target student UUID (defaults to current authenticated user; only teachers/admins can query other students)',
      required: false,
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiOkResponse({
      description: 'Student grade record retrieved successfully',
      type: GradeRecordEntity,
    }),
  );
}
