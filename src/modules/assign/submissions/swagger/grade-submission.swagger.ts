import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { GradeSubmissionDto } from '../dto/grade-submission.dto';
import { SubmissionEntity } from '../entities/submission.entity';

export function ApiGradeSubmission() {
  return applyDecorators(
    ApiOperation({ summary: 'Grade a student submission' }),
    ApiAuth(),
    ApiParam({
      name: 'id',
      description: 'UUID of the submission to grade',
      type: 'string',
    }),
    ApiBody({ type: GradeSubmissionDto }),
    ApiOkResponse({
      description: 'Submission graded successfully',
      type: SubmissionEntity,
    }),
  );
}
