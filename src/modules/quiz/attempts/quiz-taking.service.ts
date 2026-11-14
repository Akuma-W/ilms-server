import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { CheckAnswerDto, StartAttemptDto, SubmitAttemptDto } from './dto';
import {
  CheckedAnswerResult,
  SubmittedAttemptResult,
  TakeQuizSessionResult,
} from './interfaces/submitted-attempt-result.interface';
import {
  gradeQuizSubmission,
  buildAttemptDetailResults,
} from '../utils/quiz-scoring.util';

@Injectable()
export class QuizTakingService {
  constructor(private readonly prisma: PrismaService) {}

  // Starts a new quiz attempt and returns session questions
  async startAttempt(
    userId: string,
    quizId: string,
    dto: StartAttemptDto,
  ): Promise<TakeQuizSessionResult> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            options: {
              select: { id: true, content: true },
            },
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    let resolvedReviewMode = quiz.reviewMode;

    if (dto.publicationId) {
      const pub = await this.prisma.quizPublication.findUnique({
        where: { id: dto.publicationId },
        include: { class: { select: { id: true, teacherId: true } } },
      });

      if (!pub || pub.quizId !== quizId) {
        throw new NotFoundException('Quiz publication not found for this quiz');
      }

      resolvedReviewMode = pub.reviewMode;

      const now = new Date();
      if (pub.openAt && now < pub.openAt) {
        throw new BadRequestException('This quiz is not opened yet');
      }
      if (pub.closeAt && now > pub.closeAt) {
        throw new BadRequestException('This quiz submission window has closed');
      }

      if (pub.classId) {
        const isEnrolled = await this.prisma.enrollment.count({
          where: { classId: pub.classId, userId },
        });
        const isTeacher = pub.class?.teacherId === userId;
        if (!isEnrolled && !isTeacher) {
          throw new ForbiddenException(
            'You are not enrolled in this class to take the quiz',
          );
        }
      }
    } else if (quiz.visibility === 'private' && quiz.createdBy !== userId) {
      throw new ForbiddenException(
        'Cannot take a private quiz of another user',
      );
    }

    let attempt = await this.prisma.quizAttempt.findFirst({
      where: {
        quizId,
        studentId: userId,
        publicationId: dto.publicationId ?? null,
        submittedAt: null,
      },
      orderBy: { startedAt: 'desc' },
    });

    if (!attempt) {
      attempt = await this.prisma.quizAttempt.create({
        data: {
          quizId,
          studentId: userId,
          publicationId: dto.publicationId,
          startedAt: new Date(),
        },
      });
    }

    return {
      attemptId: attempt.id,
      quizId: quiz.id,
      title: quiz.title,
      timeLimit: quiz.timeLimit,
      startedAt: attempt.startedAt,
      publicationId: dto.publicationId,
      reviewMode: resolvedReviewMode,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        content: q.content,
        questionType: q.questionType,
        points: q.points,
        orderIndex: q.orderIndex,
        options: q.options.map((opt) => ({
          id: opt.id,
          content: opt.content,
        })),
      })),
    };
  }

  // Evaluates a single question answer for instant feedback mode
  async checkAnswer(
    userId: string,
    attemptId: string,
    dto: CheckAnswerDto,
  ): Promise<CheckedAnswerResult> {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: {
              where: { id: dto.questionId },
              include: { options: true },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Quiz attempt not found');
    }
    if (attempt.studentId !== userId) {
      throw new ForbiddenException(
        'You can only check your own attempt answer',
      );
    }
    if (attempt.submittedAt !== null) {
      throw new BadRequestException('This quiz attempt is already submitted');
    }

    const question = attempt.quiz.questions[0];
    if (!question) {
      throw new NotFoundException('Question not found in quiz attempt');
    }

    const correctOptions = question.options.filter((opt) => opt.isCorrect);
    const correctOptionIds = correctOptions.map((opt) => opt.id);
    const selectedSet = new Set(dto.selectedOptionIds);
    const isCorrect =
      correctOptionIds.length === dto.selectedOptionIds.length &&
      correctOptionIds.every((id) => selectedSet.has(id));

    return {
      questionId: question.id,
      isCorrect,
      pointsEarned: isCorrect ? (question.points ?? 1) : 0,
      correctOptionIds,
      explanation: question.explanation,
    };
  }

  // Submits the attempt, computes total score and records submission
  async submitAttempt(
    userId: string,
    attemptId: string,
    dto: SubmitAttemptDto,
  ): Promise<SubmittedAttemptResult> {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: {
              include: { options: true },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Quiz attempt not found');
    }
    if (attempt.studentId !== userId) {
      throw new ForbiddenException('You can only submit your own attempt');
    }
    if (attempt.submittedAt !== null) {
      throw new BadRequestException(
        'This quiz attempt has already been submitted',
      );
    }

    const questions = attempt.quiz.questions;
    const gradingResult = gradeQuizSubmission(questions, dto.answers);

    await this.prisma.$transaction(async (tx) => {
      await tx.quizAttempt.update({
        where: { id: attemptId },
        data: {
          score: gradingResult.score,
          submittedAt: new Date(),
        },
      });

      const answerRecords: Array<{
        attemptId: string;
        questionId: string;
        selectedOption: string;
      }> = [];

      for (const ans of dto.answers) {
        for (const optId of ans.selectedOptionIds || []) {
          answerRecords.push({
            attemptId,
            questionId: ans.questionId,
            selectedOption: optId,
          });
        }
      }

      if (answerRecords.length > 0) {
        await tx.quizAnswer.createMany({
          data: answerRecords,
        });
      }
    });

    const answersMap = new Map<string, string[]>();
    for (const ans of dto.answers) {
      answersMap.set(ans.questionId, ans.selectedOptionIds || []);
    }

    const details = buildAttemptDetailResults(
      questions,
      gradingResult.details,
      answersMap,
    );

    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);

    return {
      attemptId,
      quizId: attempt.quizId,
      score: gradingResult.score,
      totalPoints,
      totalQuestions: gradingResult.totalQuestions,
      correctCount: gradingResult.correctCount,
      submittedAt: new Date(),
      details,
    };
  }
}
