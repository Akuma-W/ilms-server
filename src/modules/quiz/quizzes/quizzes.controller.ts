import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/modules/auth/session/guards/jwt-auth.guard';
import { CreateQuizDto, QueryQuizDto, UpdateQuizDto } from './dto';
import { QuizEntity } from './entities/quiz.entity';
import { QuizzesService } from './quizzes.service';

@ApiTags('Quizzes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  // Create a new quiz template in personal library
  @Post()
  @ApiOperation({ summary: 'Create a new quiz' })
  @ApiResponse({
    status: 201,
    description: 'Quiz created successfully',
    type: QuizEntity,
  })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateQuizDto) {
    return this.quizzesService.createQuiz(userId, dto);
  }

  // Get paginated list of quizzes
  @Get()
  @ApiOperation({ summary: 'Get paginated quizzes list (library / community)' })
  @ApiResponse({
    status: 200,
    description: 'List of quizzes with pagination metadata',
  })
  findAll(@CurrentUser('id') userId: string, @Query() query: QueryQuizDto) {
    return this.quizzesService.getQuizzes(userId, query);
  }

  // Get quiz details by ID
  @Get(':id')
  @ApiOperation({ summary: 'Get quiz details and question list by ID' })
  @ApiResponse({
    status: 200,
    description: 'Quiz details with questions',
    type: QuizEntity,
  })
  findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.quizzesService.getQuizById(userId, id);
  }

  // Update quiz metadata
  @Patch(':id')
  @ApiOperation({ summary: 'Update quiz metadata (creator only)' })
  @ApiResponse({
    status: 200,
    description: 'Quiz updated successfully',
    type: QuizEntity,
  })
  update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQuizDto,
  ) {
    return this.quizzesService.updateQuiz(userId, id, dto);
  }

  // Delete quiz
  @Delete(':id')
  @ApiOperation({ summary: 'Delete quiz (creator only)' })
  @ApiResponse({ status: 200, description: 'Quiz deleted successfully' })
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.quizzesService.deleteQuiz(userId, id);
    return { message: 'Quiz deleted successfully' };
  }

  // Clone quiz to own library
  @Post(':id/clone')
  @ApiOperation({
    summary: 'Clone a public quiz or own quiz into personal library',
  })
  @ApiResponse({
    status: 201,
    description: 'Quiz cloned successfully',
    type: QuizEntity,
  })
  clone(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.quizzesService.cloneQuiz(userId, id);
  }
}
