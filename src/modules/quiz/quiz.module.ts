import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructures/prisma/prisma.module';
import { QuizAttemptsController } from './attempts/quiz-attempts.controller';
import { QuizAttemptsService } from './attempts/quiz-attempts.service';
import { QuizPublicationsController } from './publications/quiz-publications.controller';
import { QuizPublicationsService } from './publications/quiz-publications.service';
import { QuestionsController } from './questions/questions.controller';
import { QuestionsService } from './questions/questions.service';
import { QuizzesController } from './quizzes/quizzes.controller';
import { QuizzesService } from './quizzes/quizzes.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    QuizzesController,
    QuestionsController,
    QuizPublicationsController,
    QuizAttemptsController,
  ],
  providers: [
    QuizzesService,
    QuestionsService,
    QuizPublicationsService,
    QuizAttemptsService,
  ],
  exports: [
    QuizzesService,
    QuestionsService,
    QuizPublicationsService,
    QuizAttemptsService,
  ],
})
export class QuizModule {}
