import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { checkTeacherPermission } from 'src/modules/academic/utils/academic-permission.util';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';

@Injectable()
export class TopicsService {
  constructor(private readonly prisma: PrismaService) {}

  // Creates a new topic inside a class with calculated order index.
  async create(
    userId: string,
    classId: string,
    createTopicDto: CreateTopicDto,
  ) {
    const lastTopic = await this.prisma.topic.findFirst({
      where: { classId },
      orderBy: { orderIndex: 'desc' },
    });

    const orderIndex = (lastTopic?.orderIndex || 0) + 1;

    const topic = await this.prisma.topic.create({
      data: {
        ...createTopicDto,
        classId,
        createdBy: userId,
        orderIndex,
      },
    });

    return {
      message: 'Create topic successful',
      data: topic,
    };
  }

  // Retrieves all topics for a class with eagerly loaded materials, references, assignments, quizzes, and user reading progress.
  async findAll(classId: string, userId?: string) {
    const topics = await this.prisma.topic.findMany({
      where: { classId },
      include: {
        materials: {
          include: userId
            ? {
                materialProgresses: {
                  where: { studentId: userId },
                  select: { isCompleted: true },
                },
              }
            : undefined,
          orderBy: { createdAt: 'asc' },
        },
        references: {
          orderBy: { title: 'asc' },
        },
        assignments: {
          orderBy: { createdAt: 'asc' },
        },
        quizPublications: {
          include: {
            quiz: true,
          },
          orderBy: { publishedAt: 'asc' },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });

    const mapTopicResources = (topic: (typeof topics)[number]) => {
      const mappedMaterials = topic.materials.map((m) => {
        const progresses = (
          m as typeof m & {
            materialProgresses?: Array<{ isCompleted: boolean }>;
          }
        ).materialProgresses;
        const isCompleted = progresses?.[0]?.isCompleted ?? false;
        const rest = { ...m };
        delete (rest as { materialProgresses?: unknown }).materialProgresses;
        return {
          ...rest,
          isCompleted,
        };
      });

      const mappedQuizzes = (topic.quizPublications || []).map((pub) => ({
        ...pub.quiz,
        id: pub.id,
        quizId: pub.quizId,
        publicationId: pub.id,
        openAt: pub.openAt,
        closeAt: pub.closeAt,
      }));

      return {
        ...topic,
        materials: mappedMaterials,
        assignments: topic.assignments || [],
        quizzes: mappedQuizzes,
      };
    };

    return topics.map(mapTopicResources);
  }

  // Searches topics within a class by matching title substring.
  async findMany(classId: string, title?: string) {
    return this.prisma.topic.findMany({
      where: {
        classId,
        title: {
          contains: title,
          mode: 'insensitive',
        },
      },
    });
  }

  // Updates topic title, description, or ordering index.
  async update(userId: string, topicId: string, dto: UpdateTopicDto) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) throw new NotFoundException('Topic does not exist');

    if (topic.createdBy !== userId) {
      await this.checkTeacher(userId, topic.classId);
    }

    return this.prisma.topic.update({
      where: { id: topicId },
      data: dto,
    });
  }

  // Cascading deletes a topic along with all associated learning resources.
  async delete(userId: string, topicId: string) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) throw new NotFoundException('Topic does not exist');

    if (topic.createdBy !== userId) {
      await this.checkTeacher(userId, topic.classId);
    }

    await this.prisma.$transaction([
      this.prisma.material.deleteMany({ where: { topicId } }),
      this.prisma.reference.deleteMany({ where: { topicId } }),
      this.prisma.quizPublication.deleteMany({ where: { topicId } }),
      this.prisma.assignment.deleteMany({ where: { topicId } }),
      this.prisma.conversation.deleteMany({ where: { topicId } }),
      this.prisma.embedding.deleteMany({ where: { topicId } }),
      this.prisma.retrievalCache.deleteMany({ where: { topicId } }),
      this.prisma.topic.delete({ where: { id: topicId } }),
    ]);
  }

  // Validates if the user is authorized as an instructor or class owner.
  private async checkTeacher(userId: string, classId: string) {
    return checkTeacherPermission(
      this.prisma,
      userId,
      classId,
      undefined,
      'You are not teacher of class',
    );
  }
}
