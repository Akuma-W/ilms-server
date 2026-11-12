import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/modules/auth/session/guards/jwt-auth.guard';
import { StartAttemptDto, SubmitAttemptDto } from './dto';
import { QuizAttemptEntity } from './entities/quiz-attempt.entity';
import { QuizAttemptsService } from './quiz-attempts.service';

@ApiTags('Quiz Attempts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class QuizAttemptsController {
  constructor(private readonly attemptsService: QuizAttemptsService) {}

  // Start taking a quiz attempt
  @Post('quizzes/:quizId/attempts')
  @ApiOperation({ summary: 'Start a new quiz attempt' })
  @ApiResponse({
    status: 201,
    description: 'Attempt started with exam questions',
  })
  start(
    @CurrentUser('id') userId: string,
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Body() dto: StartAttemptDto,
  ) {
    return this.attemptsService.startAttempt(userId, quizId, dto);
  }

  // Submit attempt answers for grading
  @Post('quiz-attempts/:id/submit')
  @ApiOperation({ summary: 'Submit answers for an active attempt' })
  @ApiResponse({
    status: 200,
    description: 'Attempt graded successfully',
    type: QuizAttemptEntity,
  })
  submit(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitAttemptDto,
  ) {
    return this.attemptsService.submitAttempt(userId, id, dto);
  }

  // Review a submitted attempt result
  @Get('quiz-attempts/:id')
  @ApiOperation({ summary: 'Get detailed results of a submitted attempt' })
  @ApiResponse({
    status: 200,
    description: 'Detailed attempt result',
    type: QuizAttemptEntity,
  })
  findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.attemptsService.getAttemptResult(userId, id);
  }

  // Get user history of attempts for a quiz
  @Get('quizzes/:quizId/my-attempts')
  @ApiOperation({ summary: 'Get current user attempts history for a quiz' })
  @ApiQuery({ name: 'publicationId', required: false, type: 'string' })
  @ApiResponse({ status: 200, description: 'List of past attempts' })
  findUserAttempts(
    @CurrentUser('id') userId: string,
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Query('publicationId') publicationId?: string,
  ) {
    return this.attemptsService.getUserAttempts(userId, quizId, publicationId);
  }

  // Get class statistics for teacher
  @Get('quiz-publications/:id/stats')
  @ApiOperation({
    summary: 'Get class grade statistics and score matrix (teacher only)',
  })
  @ApiResponse({ status: 200, description: 'Class quiz performance analytics' })
  getClassStats(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.attemptsService.getClassPublicationStats(userId, id);
  }
}
