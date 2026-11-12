import {
  Body,
  Controller,
  Delete,
  Param,
  ParseArrayPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/modules/auth/session/guards/jwt-auth.guard';
import {
  CreateQuestionDto,
  ReorderQuestionsDto,
  UpdateQuestionDto,
} from './dto';
import { QuestionEntity } from './entities/question.entity';
import { QuestionsService } from './questions.service';

@ApiTags('Quiz Questions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  // Create single question under a quiz
  @Post('quizzes/:quizId/questions')
  @ApiOperation({ summary: 'Create a new question for a quiz' })
  @ApiResponse({
    status: 201,
    description: 'Question created successfully',
    type: QuestionEntity,
  })
  create(
    @CurrentUser('id') userId: string,
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.questionsService.createQuestion(userId, quizId, dto);
  }

  // Batch import questions into a quiz
  @Post('quizzes/:quizId/questions/batch')
  @ApiOperation({ summary: 'Batch create questions (Word import parser)' })
  @ApiBody({ type: [CreateQuestionDto] })
  @ApiResponse({
    status: 201,
    description: 'Batch questions created successfully',
    type: [QuestionEntity],
  })
  batchCreate(
    @CurrentUser('id') userId: string,
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Body(new ParseArrayPipe({ items: CreateQuestionDto }))
    dtos: CreateQuestionDto[],
  ) {
    return this.questionsService.batchCreateQuestions(userId, quizId, dtos);
  }

  // Reorder questions
  @Patch('quizzes/:quizId/questions/reorder')
  @ApiOperation({ summary: 'Reorder questions in a quiz' })
  @ApiResponse({
    status: 200,
    description: 'Questions reordered successfully',
    type: [QuestionEntity],
  })
  reorder(
    @CurrentUser('id') userId: string,
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Body() dto: ReorderQuestionsDto,
  ) {
    return this.questionsService.reorderQuestions(userId, quizId, dto);
  }

  // Update existing question
  @Patch('questions/:id')
  @ApiOperation({ summary: 'Update a question and its options' })
  @ApiResponse({
    status: 200,
    description: 'Question updated successfully',
    type: QuestionEntity,
  })
  update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.questionsService.updateQuestion(userId, id, dto);
  }

  // Delete question
  @Delete('questions/:id')
  @ApiOperation({ summary: 'Delete a question' })
  @ApiResponse({ status: 200, description: 'Question deleted successfully' })
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.questionsService.deleteQuestion(userId, id);
    return { message: 'Question deleted successfully' };
  }
}
