import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { SubmissionsService } from './submissions.service';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';
import { GradeSubmissionDto } from './dto/grade-submission.dto';
import { ApiSubmitAssignment } from './swagger/submit-assignment.swagger';
import { ApiUpdateSubmission } from './swagger/update-submission.swagger';
import { ApiGradeSubmission } from './swagger/grade-submission.swagger';
import { ApiDeleteSubmission } from './swagger/delete-submission.swagger';

/**
 * Controller handling assignment submissions and teacher grading workflows.
 */
@ApiTags('Submissions')
@Controller()
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post('assignments/:assignmentId/submissions')
  @ApiSubmitAssignment()
  async submit(
    @CurrentUser('id') userId: string,
    @Param('assignmentId', new ParseUUIDPipe()) assignmentId: string,
    @Body() dto: SubmitAssignmentDto,
  ) {
    return this.submissionsService.submit(userId, assignmentId, dto);
  }

  @Put('submissions/:id')
  @ApiUpdateSubmission()
  async update(
    @CurrentUser('id') userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SubmitAssignmentDto,
  ) {
    return this.submissionsService.update(userId, id, dto);
  }

  @Patch('submissions/:id')
  @ApiUpdateSubmission()
  async updatePatch(
    @CurrentUser('id') userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SubmitAssignmentDto,
  ) {
    return this.submissionsService.update(userId, id, dto);
  }

  @Post('submissions/:id/grade')
  @ApiGradeSubmission()
  async grade(
    @CurrentUser('id') userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: GradeSubmissionDto,
  ) {
    return this.submissionsService.grade(userId, id, dto);
  }

  @Delete('submissions/:id')
  @ApiDeleteSubmission()
  async delete(
    @CurrentUser('id') userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.submissionsService.delete(userId, id);
  }
}
