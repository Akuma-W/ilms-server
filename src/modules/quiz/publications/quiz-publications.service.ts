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

    return this.prisma.quizPublication.upsert({
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
            _count: {
              select: { questions: true },
            },
          },
        },
        class: {
          select: { id: true, title: true, courseCode: true },
        },
      },
    });
  }

  // Get all quiz publications for a specific class
  async getClassPublications(
    userId: string,
    classId: string,
  ): Promise<QuizPublicationEntity[]> {
    const [isTeacher, isStudent] = await Promise.all([
      this.prisma.class.count({ where: { id: classId, teacherId: userId } }),
      this.prisma.enrollment.count({ where: { classId, userId } }),
    ]);

    if (!isTeacher && !isStudent) {
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

    return publications.map((pub) => ({
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
      latestUserAttempt: pub.attempts.length > 0 ? pub.attempts[0] : null,
      quiz: pub.quiz,
    }));
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

    return this.prisma.quizPublication.delete({
      where: { id: publicationId },
    });
  }
}
