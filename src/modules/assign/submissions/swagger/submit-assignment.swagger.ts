import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { SubmitAssignmentDto } from '../dto/submit-assignment.dto';
import { SubmissionEntity } from '../entities/submission.entity';

export function ApiSubmitAssignment() {
  return applyDecorators(
    ApiOperation({ summary: 'Submit student work for an assignment' }),
    ApiAuth(),
    ApiParam({
      name: 'assignmentId',
      description: 'UUID of the assignment',
      type: 'string',
    }),
    ApiBody({ type: SubmitAssignmentDto }),
    ApiCreatedResponse({
      description: 'Assignment submitted successfully',
      type: SubmissionEntity,
    }),
  );
}
