import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';

/**
 * Service managing topic organization and associated learning materials/references.
 */
@Injectable()
export class TopicsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new topic inside a class with calculated order index.
   */
  async create(
    userId: string,
    classId: string,
    createTopicDto: CreateTopicDto,
  ) {
    await this.checkTeacher(userId, classId);

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

  /**
   * Retrieves all topics for a class with eagerly loaded materials and references.
   */
  async findAll(classId: string) {
    return this.prisma.topic.findMany({
      where: { classId },
      include: {
        materials: {
          orderBy: { createdAt: 'asc' },
        },
        references: {
          orderBy: { title: 'asc' },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });
  }

  /**
   * Searches topics within a class by matching title substring.
   */
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

  /**
   * Updates topic title, description, or ordering index.
   */
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

  /**
   * Cascading deletes a topic along with all associated learning resources.
   */
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

  /**
   * Validates if the user is authorized as an instructor or class owner.
   */
  private async checkTeacher(userId: string, classId: string) {
    const classroom = await this.prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classroom) {
      throw new NotFoundException('Class does not exist');
    }

    if (classroom.teacherId === userId) {
      return;
    }

    const enrollment = await this.prisma.enrollment.findFirst({
      where: { userId, classId },
    });

    if (
      !enrollment ||
      enrollment.roleIn !== 'teacher' ||
      enrollment.status !== 'approved'
    ) {
      throw new ForbiddenException('You are not teacher of class');
    }
  }
}
