import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import { PaginatedResult } from 'src/common/interfaces/paginated-result.interface';
import { AdminQuizEntity } from './entities/admin-quiz.entity';
import { QueryAdminQuizzesDto } from './dto/query-admin-quizzes.dto';
import { TakedownQuizDto } from './dto/takedown-quiz.dto';
import { AdminActionResult } from '../interfaces/admin-action-result.interface';

@Injectable()
export class AdminQuizzesService {
  constructor(private readonly prisma: PrismaService) {}

  // Lists all quizzes across system with question and attempt counters
  async findAll(
    query: QueryAdminQuizzesDto,
  ): Promise<PaginatedResult<AdminQuizEntity>> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const where: Prisma.QuizWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.visibility) {
      where.visibility = query.visibility;
    }

    if (query.search?.trim()) {
      const keyword = query.search.trim();
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
        { creator: { fullName: { contains: keyword, mode: 'insensitive' } } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.quiz.count({ where }),
      this.prisma.quiz.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }],
        include: {
          creator: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              questions: true,
              attempts: true,
            },
          },
        },
      }),
    ]);

    const data: AdminQuizEntity[] = items.map((quiz) => ({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      timeLimit: quiz.timeLimit,
      visibility: quiz.visibility,
      status: quiz.status,
      reviewMode: quiz.reviewMode,
      totalQuestions: quiz._count.questions,
      totalAttempts: quiz._count.attempts,
      creator: quiz.creator,
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt,
    }));

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Retrieves unmasked full quiz structure with questions and correct answers for audit
  async findOne(id: string): Promise<Record<string, unknown>> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            options: true,
          },
        },
        _count: {
          select: {
            attempts: true,
            publications: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    return quiz as unknown as Record<string, unknown>;
  }

  // Moderates and revokes public availability due to copyright violation
  async takedown(id: string, dto: TakedownQuizDto): Promise<AdminQuizEntity> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        },
        _count: {
          select: { questions: true, attempts: true },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    // TODO: Send in-app notification to quiz creator when in-app notification subsystem is implemented.
    // In-app payload should include: quizId: quiz.id, action: 'takedown', reason: dto.reason.

    const updated = await this.prisma.quiz.update({
      where: { id },
      data: {
        visibility: 'private',
        status: 'draft',
        description: quiz.description
          ? `${quiz.description}\n[Cảnh báo bản quyền: ${dto.reason}]`
          : `[Cảnh báo bản quyền: ${dto.reason}]`,
      },
      include: {
        creator: {
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        },
        _count: {
          select: { questions: true, attempts: true },
        },
      },
    });

    return {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      timeLimit: updated.timeLimit,
      visibility: updated.visibility,
      status: updated.status,
      reviewMode: updated.reviewMode,
      totalQuestions: updated._count.questions,
      totalAttempts: updated._count.attempts,
      creator: updated.creator,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  // Force removes quiz examination bypassing personal creator ownership
  async forceDelete(id: string, reason?: string): Promise<AdminActionResult> {
    void reason;
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    await this.prisma.$transaction(async (tx) => {
      const questions = await tx.question.findMany({
        where: { quizId: id },
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
          where: { quizId: id },
        });
      }

      await tx.quizAttempt.deleteMany({
        where: { quizId: id },
      });

      await tx.quizPublication.deleteMany({
        where: { quizId: id },
      });

      await tx.quiz.delete({
        where: { id },
      });
    });

    return {
      success: true,
      message:
        'The quiz has been forcibly removed from the system successfully',
    };
  }
}
