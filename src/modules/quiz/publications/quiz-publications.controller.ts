import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
import {
  ClassTeacherGuard,
  ClassMemberGuard,
  ClassNotArchivedGuard,
} from 'src/common/guards';
import { PublishQuizDto, UpdatePublicationDto } from './dto';
import { QuizPublicationEntity } from './entities/quiz-publication.entity';
import { QuizPublicationsService } from './quiz-publications.service';

@ApiTags('Quiz Publications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class QuizPublicationsController {
  constructor(private readonly publicationsService: QuizPublicationsService) {}

  // Publish a quiz into a class
  @Post('quizzes/:quizId/publications')
  @UseGuards(ClassTeacherGuard, ClassNotArchivedGuard)
  @ApiOperation({ summary: 'Publish a quiz into a class' })
  @ApiResponse({
    status: 201,
    description: 'Quiz published successfully',
    type: QuizPublicationEntity,
  })
  publish(
    @CurrentUser('id') userId: string,
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Body() dto: PublishQuizDto,
  ) {
    return this.publicationsService.publishToClass(userId, quizId, dto);
  }

  // Get all quiz publications in a class
  @Get('classes/:classId/quizzes')
  @UseGuards(ClassMemberGuard)
  @ApiOperation({ summary: 'Get all quizzes published in a class' })
  @ApiResponse({
    status: 200,
    description: 'List of published quizzes in class',
  })
  findByClass(
    @CurrentUser('id') userId: string,
    @Param('classId', ParseUUIDPipe) classId: string,
  ) {
    return this.publicationsService.getClassPublications(userId, classId);
  }

  // Get single publication details
  @Get('quiz-publications/:id')
  @ApiOperation({ summary: 'Get publication details by ID' })
  @ApiResponse({
    status: 200,
    description: 'Publication details',
    type: QuizPublicationEntity,
  })
  findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.publicationsService.getPublicationById(userId, id);
  }

  // Update publication settings
  @Patch('quiz-publications/:id')
  @ApiOperation({ summary: 'Update publication schedule or settings' })
  @ApiResponse({
    status: 200,
    description: 'Publication updated successfully',
    type: QuizPublicationEntity,
  })
  update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePublicationDto,
  ) {
    return this.publicationsService.updatePublication(userId, id, dto);
  }

  // Delete/unpublish quiz publication
  @Delete('quiz-publications/:id')
  @ApiOperation({ summary: 'Unpublish quiz from class' })
  @ApiResponse({ status: 200, description: 'Quiz unpublished successfully' })
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.publicationsService.deletePublication(userId, id);
    return { message: 'Quiz unpublished successfully' };
  }
}
