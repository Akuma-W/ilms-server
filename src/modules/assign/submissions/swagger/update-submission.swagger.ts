import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { SubmitAssignmentDto } from '../dto/submit-assignment.dto';
import { SubmissionEntity } from '../entities/submission.entity';

export function ApiUpdateSubmission() {
  return applyDecorators(
    ApiOperation({ summary: 'Update student submission files or text answer' }),
    ApiAuth(),
    ApiParam({
      name: 'id',
      description: 'UUID of the submission',
      type: 'string',
    }),
    ApiBody({ type: SubmitAssignmentDto }),
    ApiOkResponse({
      description: 'Submission updated successfully',
      type: SubmissionEntity,
    }),
  );
}
