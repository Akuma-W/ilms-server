import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { ClassQuizStatsResult } from '../interfaces';
import {
  AttemptReviewResult,
  UserPastAttemptSummary,
} from './interfaces/submitted-attempt-result.interface';
import {
  buildAttemptDetailResults,
  calculateClassQuizPerformance,
  gradeQuizSubmission,
} from '../utils/quiz-scoring.util';

@Injectable()
export class QuizAttemptsService {
  constructor(private readonly prisma: PrismaService) {}

  // Retrieves graded attempt review with visibility rules applied
  async getAttemptResult(
    userId: string,
    attemptId: string,
  ): Promise<AttemptReviewResult> {
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
    const rawDetails = buildAttemptDetailResults(
      attempt.quiz.questions,
      grading.details,
      answersMap,
    );

    const reviewMode =
      attempt.publication?.reviewMode ||
      attempt.quiz.reviewMode ||
      'after_submission';
    let canViewAnswers = true;
    let message: string | undefined;

    if (isStudent && !isTeacher && !isQuizOwner) {
      if (reviewMode === 'never') {
        canViewAnswers = false;
        message = 'Giảng viên đã tắt tính năng xem lại đáp án cho đề thi này.';
      } else if (
        reviewMode === 'after_closed' &&
        attempt.publication?.closeAt &&
        new Date() < attempt.publication.closeAt
      ) {
        canViewAnswers = false;
        message = `Đáp án chi tiết sẽ được mở sau khi đợt thi kết thúc vào ${attempt.publication.closeAt.toLocaleString('vi-VN')}.`;
      }
    }

    const details = canViewAnswers
      ? rawDetails
      : rawDetails.map((item) => ({
          ...item,
          isCorrect: false,
          explanation: null,
          correctOptionIds: [],
        }));

    const totalPoints = attempt.quiz.questions.reduce(
      (sum, q) => sum + (q.points || 0),
      0,
    );

    return {
      attemptId: attempt.id,
      quizId: attempt.quizId,
      title: attempt.quiz.title,
      studentId: attempt.studentId,
      publicationId: attempt.publicationId,
      score: attempt.score,
      totalPoints,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      totalQuestions: grading.totalQuestions,
      correctCount: grading.correctCount,
      reviewMode,
      canViewAnswers,
      message,
      details,
    };
  }

  // Retrieves user past attempt history for a specific quiz
  async getUserAttempts(
    userId: string,
    quizId: string,
    publicationId?: string,
  ): Promise<UserPastAttemptSummary[]> {
    const where: {
      quizId: string;
      studentId: string;
      submittedAt: { not: null };
      publicationId?: string;
    } = {
      quizId,
      studentId: userId,
      submittedAt: { not: null },
    };
    if (publicationId) {
      where.publicationId = publicationId;
    }

    return this.prisma.quizAttempt.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
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

  // Computes class-wide score performance and grade distribution matrix
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
