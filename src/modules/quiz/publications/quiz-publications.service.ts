import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import {
  checkClassTeacherPermission,
  findQuizOrThrow,
} from '../utils/quiz-permission.util';
import { PublishQuizDto, UpdatePublicationDto } from './dto';
import { QuizPublicationEntity } from './entities/quiz-publication.entity';

@Injectable()
export class QuizPublicationsService {
  constructor(private readonly prisma: PrismaService) {}

  // Publish a quiz into a class
  async publishToClass(
    userId: string,
    quizId: string,
    dto: PublishQuizDto,
  ): Promise<QuizPublicationEntity> {
    await checkClassTeacherPermission(this.prisma, dto.classId, userId);

    const quiz = await findQuizOrThrow(this.prisma, quizId);
    if (quiz.visibility === 'private' && quiz.createdBy !== userId) {
      throw new ForbiddenException('Cannot publish another user private quiz');
    }

    const [publication] = await Promise.all([
      this.prisma.quizPublication.upsert({
        where: {
          quizId_classId: {
            quizId,
            classId: dto.classId,
          },
        },
        create: {
          quizId,
          classId: dto.classId,
          topicId: dto.topicId,
          openAt: dto.openAt,
          closeAt: dto.closeAt,
          isPublic: dto.isPublic ?? false,
          publishedAt: new Date(),
        },
        update: {
          topicId: dto.topicId,
          openAt: dto.openAt,
          closeAt: dto.closeAt,
          isPublic: dto.isPublic,
        },
        include: {
          quiz: {
            select: {
              id: true,
              title: true,
              description: true,
              timeLimit: true,
              questions: {
                select: { points: true },
              },
              _count: {
                select: { questions: true },
              },
            },
          },
          class: {
            select: { id: true, title: true, courseCode: true },
          },
        },
      }),
      this.prisma.quiz.update({
        where: { id: quizId },
        data: { status: 'published' },
      }),
    ]);

    return publication;
  }

  // Get all quiz publications for a specific class
  async getClassPublications(
    userId: string,
    classId: string,
  ): Promise<QuizPublicationEntity[]> {
    const [isTeacher, enrolledCount, totalStudents] = await Promise.all([
      this.prisma.class.count({ where: { id: classId, teacherId: userId } }),
      this.prisma.enrollment.count({
        where: { classId, userId, status: 'approved' },
      }),
      this.prisma.enrollment.count({ where: { classId, status: 'approved' } }),
    ]);

    if (!isTeacher && !enrolledCount) {
      throw new ForbiddenException('You are not a member of this class');
    }

    const publications = await this.prisma.quizPublication.findMany({
      where: { classId },
      orderBy: { publishedAt: 'desc' },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            description: true,
            timeLimit: true,
            questions: {
              select: { points: true },
            },
            _count: {
              select: { questions: true },
            },
          },
        },
        topic: {
          select: { id: true, title: true },
        },
        _count: {
          select: { attempts: true },
        },
        attempts: {
          where: { studentId: userId },
          orderBy: { startedAt: 'desc' },
          take: 1,
          select: {
            id: true,
            score: true,
            startedAt: true,
            submittedAt: true,
          },
        },
      },
    });

    const submittedAttempts = publications.length
      ? await this.prisma.quizAttempt.findMany({
          where: {
            publicationId: {
              in: publications.map((publication) => publication.id),
            },
            submittedAt: { not: null },
          },
          distinct: ['publicationId', 'studentId'],
          select: { publicationId: true, studentId: true },
        })
      : [];
    const submittedCountByPublication = new Map<string, number>();
    for (const attempt of submittedAttempts) {
      if (attempt.publicationId) {
        submittedCountByPublication.set(
          attempt.publicationId,
          (submittedCountByPublication.get(attempt.publicationId) ?? 0) + 1,
        );
      }
    }

    return publications.map((pub) => {
      const totalPoints = pub.quiz?.questions?.length
        ? Number(
            pub.quiz.questions
              .reduce((sum, q) => sum + (q.points || 0), 0)
              .toFixed(1),
          )
        : 10;

      return {
        id: pub.id,
        quizId: pub.quizId,
        classId: pub.classId,
        topicId: pub.topicId,
        topic: pub.topic,
        openAt: pub.openAt,
        closeAt: pub.closeAt,
        isPublic: pub.isPublic,
        publishedAt: pub.publishedAt,
        totalAttemptsCount: pub._count.attempts,
        submittedCount: submittedCountByPublication.get(pub.id) ?? 0,
        totalStudents,
        latestUserAttempt: pub.attempts.length > 0 ? pub.attempts[0] : null,
        quiz: {
          ...pub.quiz,
          totalPoints,
        },
      };
    });
  }

  // Get publication by ID
  async getPublicationById(
    userId: string,
    publicationId: string,
  ): Promise<QuizPublicationEntity> {
    const publication = await this.prisma.quizPublication.findUnique({
      where: { id: publicationId },
      include: {
        quiz: {
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
        },
        class: {
          select: { id: true, title: true, courseCode: true, teacherId: true },
        },
        topic: {
          select: { id: true, title: true },
        },
        _count: {
          select: { attempts: true },
        },
      },
    });

    if (!publication) {
      throw new NotFoundException('Quiz publication not found');
    }

    return {
      ...publication,
      totalAttemptsCount: publication._count.attempts,
      quiz: publication.quiz
        ? {
            id: publication.quiz.id,
            title: publication.quiz.title,
            timeLimit: publication.quiz.timeLimit,
            totalQuestions: publication.quiz.questions.length,
            totalPoints: Number(
              publication.quiz.questions
                .reduce((sum, q) => sum + (q.points || 0), 0)
                .toFixed(1),
            ),
          }
        : undefined,
    } as QuizPublicationEntity;
  }

  // Update publication
  async updatePublication(
    userId: string,
    publicationId: string,
    dto: UpdatePublicationDto,
  ): Promise<QuizPublicationEntity> {
    const existing = await this.prisma.quizPublication.findUnique({
      where: { id: publicationId },
      include: { class: { select: { teacherId: true } } },
    });

    if (!existing) {
      throw new NotFoundException('Quiz publication not found');
    }

    if (existing.class?.teacherId !== userId) {
      throw new ForbiddenException(
        'Only the teacher of this class can update publication settings',
      );
    }

    return this.prisma.quizPublication.update({
      where: { id: publicationId },
      data: {
        ...(dto.topicId !== undefined && { topicId: dto.topicId }),
        ...(dto.openAt !== undefined && { openAt: dto.openAt }),
        ...(dto.closeAt !== undefined && { closeAt: dto.closeAt }),
        ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
      },
      include: {
        quiz: {
          select: { id: true, title: true, timeLimit: true },
        },
      },
    });
  }

  // Delete/unpublish quiz publication
  async deletePublication(
    userId: string,
    publicationId: string,
  ): Promise<QuizPublicationEntity> {
    const existing = await this.prisma.quizPublication.findUnique({
      where: { id: publicationId },
      include: { class: { select: { teacherId: true } } },
    });

    if (!existing) {
      throw new NotFoundException('Quiz publication not found');
    }

    if (existing.class?.teacherId !== userId) {
      throw new ForbiddenException(
        'Only the teacher of this class can unpublish this quiz',
      );
    }

    const deleted = await this.prisma.quizPublication.delete({
      where: { id: publicationId },
    });

    const remainingPublications = await this.prisma.quizPublication.count({
      where: { quizId: deleted.quizId },
    });
    if (remainingPublications === 0) {
      const quiz = await this.prisma.quiz.findUnique({
        where: { id: deleted.quizId },
        select: { visibility: true },
      });
      if (quiz?.visibility === 'private') {
        await this.prisma.quiz.update({
          where: { id: deleted.quizId },
          data: { status: 'draft' },
        });
      }
    }

    return deleted;
  }
}
