import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { StartAttemptDto, SubmitAttemptDto } from './dto';
import { SubmittedAttemptResult } from './interfaces/submitted-attempt-result.interface';
import { ClassQuizStatsResult } from '../interfaces';
import {
  gradeQuizSubmission,
  calculateClassQuizPerformance,
} from '../utils/quiz-scoring.util';

@Injectable()
export class QuizAttemptsService {
  constructor(private readonly prisma: PrismaService) {}

  // Start a new quiz attempt and return exam questions with masked answers
  async startAttempt(userId: string, quizId: string, dto: StartAttemptDto) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            options: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    if (dto.publicationId) {
      const pub = await this.prisma.quizPublication.findUnique({
        where: { id: dto.publicationId },
        include: { class: { select: { id: true, teacherId: true } } },
      });

      if (!pub || pub.quizId !== quizId) {
        throw new NotFoundException('Quiz publication not found for this quiz');
      }

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

    const attempt = await this.prisma.quizAttempt.create({
      data: {
        quizId,
        studentId: userId,
        publicationId: dto.publicationId,
        startedAt: new Date(),
      },
    });

    // Mask isCorrect and explanation to prevent student cheating
    const questions = quiz.questions.map((q) => ({
      id: q.id,
      content: q.content,
      questionType: q.questionType,
      points: q.points,
      orderIndex: q.orderIndex,
      options: q.options.map((opt) => ({
        id: opt.id,
        content: opt.content,
      })),
    }));

    return {
      attemptId: attempt.id,
      quizId: quiz.id,
      title: quiz.title,
      timeLimit: quiz.timeLimit,
      startedAt: attempt.startedAt,
      publicationId: dto.publicationId,
      questions,
    };
  }

  // Submit quiz attempt, auto grade answers and record score
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

    // Persist grading score and student selected answers
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

    // Build comprehensive response with correct answers and explanations
    const detailedResults = gradingResult.details.map((detail) => {
      const q = questions.find((item) => item.id === detail.questionId);
      const studentAns = dto.answers.find(
        (a) => a.questionId === detail.questionId,
      );
      const correctOptionIds = q
        ? q.options.filter((o) => o.isCorrect).map((o) => o.id)
        : [];

      return {
        ...detail,
        selectedOptionIds: studentAns ? studentAns.selectedOptionIds : [],
        correctOptionIds,
      };
    });

    return {
      attemptId,
      quizId: attempt.quizId,
      score: gradingResult.score,
      totalQuestions: gradingResult.totalQuestions,
      correctCount: gradingResult.correctCount,
      submittedAt: new Date(),
      details: detailedResults,
    };
  }

  // Get single attempt result review
  async getAttemptResult(userId: string, attemptId: string) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: {
              orderBy: { orderIndex: 'asc' },
              include: { options: true },
            },
          },
        },
        publication: {
          include: { class: { select: { teacherId: true } } },
        },
        quizAnswers: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException('Quiz attempt not found');
    }

    const isStudent = attempt.studentId === userId;
    const isTeacher = attempt.publication?.class?.teacherId === userId;
    const isQuizOwner = attempt.quiz.createdBy === userId;

    if (!isStudent && !isTeacher && !isQuizOwner) {
      throw new ForbiddenException(
        'You do not have permission to view this attempt result',
      );
    }

    if (!attempt.submittedAt) {
      throw new BadRequestException(
        'This quiz attempt is still in progress and not yet submitted',
      );
    }

    // Map answers by question
    const answersMap = new Map<string, string[]>();
    for (const ans of attempt.quizAnswers) {
      const current = answersMap.get(ans.questionId) || [];
      current.push(ans.selectedOption);
      answersMap.set(ans.questionId, current);
    }

    const submittedItems = attempt.quiz.questions.map((q) => ({
      questionId: q.id,
      selectedOptionIds: answersMap.get(q.id) || [],
    }));

    const grading = gradeQuizSubmission(attempt.quiz.questions, submittedItems);

    const details = grading.details.map((detail) => {
      const q = attempt.quiz.questions.find(
        (item) => item.id === detail.questionId,
      );
      const correctOptionIds = q
        ? q.options.filter((o) => o.isCorrect).map((o) => o.id)
        : [];

      return {
        ...detail,
        selectedOptionIds: answersMap.get(detail.questionId) || [],
        correctOptionIds,
      };
    });

    return {
      attemptId: attempt.id,
      quizId: attempt.quizId,
      title: attempt.quiz.title,
      studentId: attempt.studentId,
      publicationId: attempt.publicationId,
      score: attempt.score,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      totalQuestions: grading.totalQuestions,
      correctCount: grading.correctCount,
      details,
    };
  }

  // Get user attempts history for a quiz
  async getUserAttempts(
    userId: string,
    quizId: string,
    publicationId?: string,
  ) {
    const where: { quizId: string; studentId: string; publicationId?: string } =
      {
        quizId,
        studentId: userId,
      };
    if (publicationId) {
      where.publicationId = publicationId;
    }

    return this.prisma.quizAttempt.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        quizId: true,
        publicationId: true,
        score: true,
        startedAt: true,
        submittedAt: true,
      },
    });
  }

  // Get class-wide statistics and student score matrix for a quiz publication
  async getClassPublicationStats(
    userId: string,
    publicationId: string,
  ): Promise<ClassQuizStatsResult> {
    const publication = await this.prisma.quizPublication.findUnique({
      where: { id: publicationId },
      include: {
        class: {
          select: {
            id: true,
            title: true,
            teacherId: true,
            enrollments: {
              where: { status: 'approved' },
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
        attempts: {
          where: { submittedAt: { not: null } },
          orderBy: { startedAt: 'desc' },
          select: {
            id: true,
            studentId: true,
            score: true,
            startedAt: true,
            submittedAt: true,
          },
        },
      },
    });

    if (!publication || !publication.class) {
      throw new NotFoundException('Quiz publication or class not found');
    }

    if (publication.class.teacherId !== userId) {
      throw new ForbiddenException(
        'Only the teacher can view class quiz statistics',
      );
    }

    const students = publication.class.enrollments.map((e) => e.user);
    return calculateClassQuizPerformance(
      publicationId,
      students,
      publication.attempts,
    );
  }
}
