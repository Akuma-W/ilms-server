import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { checkQuizOwnership } from '../utils/quiz-permission.util';
import { CreateQuizDto, QueryQuizDto, UpdateQuizDto } from './dto';
import { QuizEntity } from './entities/quiz.entity';
import { PaginatedQuizzesResult, QuizDetailResult } from './interfaces';

@Injectable()
export class QuizzesService {
  constructor(private readonly prisma: PrismaService) {}

  // Create a new quiz template in user personal library
  async createQuiz(userId: string, dto: CreateQuizDto): Promise<QuizEntity> {
    return this.prisma.quiz.create({
      data: {
        title: dto.title,
        description: dto.description,
        timeLimit: dto.timeLimit,
        visibility: dto.visibility ?? 'private',
        status: dto.status ?? 'draft',
        createdBy: userId,
      },
      include: {
        creator: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
        _count: {
          select: { questions: true },
        },
      },
    });
  }

  // Get paginated list of quizzes for public catalog or user personal library
  async getQuizzes(
    userId: string,
    query: QueryQuizDto,
  ): Promise<PaginatedQuizzesResult<QuizEntity>> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const where: Prisma.QuizWhereInput = {};

    if (query.scope === 'my') {
      where.createdBy = userId;
      if (query.visibility) where.visibility = query.visibility;
      if (query.status) where.status = query.status;
    } else {
      where.visibility = 'public';
      where.status = 'published';
    }

    if (query.search) {
      where.AND = [
        {
          OR: [
            { title: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.quiz.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
          _count: {
            select: { questions: true, attempts: true },
          },
        },
      }),
      this.prisma.quiz.count({ where }),
    ]);

    return {
      items: items.map(({ _count, ...quiz }) => ({
        ...quiz,
        totalQuestions: _count.questions,
        attemptCount: _count.attempts,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get single quiz with its full questions and options
  async getQuizById(userId: string, quizId: string): Promise<QuizDetailResult> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        creator: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
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

    const isOwner = quiz.createdBy === userId;
    if (
      !isOwner &&
      (quiz.visibility !== 'public' || quiz.status !== 'published')
    ) {
      throw new ForbiddenException(
        'You do not have permission to view this quiz',
      );
    }

    // Mask isCorrect if viewer is not the owner to prevent exam leaks
    if (!isOwner) {
      return {
        ...quiz,
        questions: quiz.questions.map((q) => ({
          ...q,
          explanation: null,
          options: q.options.map((opt) => ({
            id: opt.id,
            content: opt.content,
          })),
        })),
      };
    }

    return quiz;
  }

  // Update quiz metadata
  async updateQuiz(
    userId: string,
    quizId: string,
    dto: UpdateQuizDto,
  ): Promise<QuizEntity> {
    await checkQuizOwnership(this.prisma, quizId, userId);

    return this.prisma.quiz.update({
      where: { id: quizId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.timeLimit !== undefined && { timeLimit: dto.timeLimit }),
        ...(dto.visibility !== undefined && { visibility: dto.visibility }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
      include: {
        creator: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
        _count: {
          select: { questions: true },
        },
      },
    });
  }

  // Delete quiz
  async deleteQuiz(userId: string, quizId: string): Promise<QuizEntity> {
    await checkQuizOwnership(this.prisma, quizId, userId);

    const submittedClassAttempts = await this.prisma.quizAttempt.count({
      where: {
        quizId,
        publicationId: { not: null },
        submittedAt: { not: null },
      },
    });
    if (submittedClassAttempts > 0) {
      throw new ConflictException(
        'Quiz cannot be deleted because students have submitted attempts',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Delete answers, options, questions first
      const questions = await tx.question.findMany({
        where: { quizId },
        select: { id: true },
      });
      const questionIds = questions.map((q) => q.id);

      if (questionIds.length > 0) {
        await tx.quizAnswer.deleteMany({
          where: { questionId: { in: questionIds } },
        });
        await tx.option.deleteMany({
          where: { questionId: { in: questionIds } },
        });
        await tx.question.deleteMany({
          where: { quizId },
        });
      }

      await tx.quizAttempt.deleteMany({
        where: { quizId },
      });

      await tx.quizPublication.deleteMany({
        where: { quizId },
      });

      return tx.quiz.delete({
        where: { id: quizId },
      });
    });
  }

  // Clone an existing public quiz or own quiz into current user's library
  async cloneQuiz(userId: string, quizId: string): Promise<QuizEntity> {
    const sourceQuiz = await this.prisma.quiz.findUnique({
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

    if (!sourceQuiz) {
      throw new NotFoundException('Source quiz not found');
    }

    if (
      sourceQuiz.createdBy !== userId &&
      (sourceQuiz.visibility !== 'public' || sourceQuiz.status !== 'published')
    ) {
      throw new ForbiddenException(
        'Cannot clone an unpublished or private quiz of another user',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const clonedQuiz = await tx.quiz.create({
        data: {
          title: `[Copy] ${sourceQuiz.title}`,
          description: sourceQuiz.description,
          timeLimit: sourceQuiz.timeLimit,
          visibility: 'private',
          status: 'draft',
          createdBy: userId,
        },
      });

      for (const question of sourceQuiz.questions) {
        const createdQuestion = await tx.question.create({
          data: {
            quizId: clonedQuiz.id,
            content: question.content,
            questionType: question.questionType,
            points: question.points,
            orderIndex: question.orderIndex,
            explanation: question.explanation,
          },
        });

        if (question.options.length > 0) {
          await tx.option.createMany({
            data: question.options.map((opt) => ({
              questionId: createdQuestion.id,
              content: opt.content,
              isCorrect: opt.isCorrect,
            })),
          });
        }
      }

      return tx.quiz.findUniqueOrThrow({
        where: { id: clonedQuiz.id },
        include: {
          creator: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
          _count: {
            select: { questions: true },
          },
        },
      });
    });
  }
}
