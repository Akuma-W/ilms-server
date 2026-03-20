import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';

@Injectable()
export class TopicsService {
  constructor(private readonly prisma: PrismaService) {}

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

  async findAll(classId: string) {
    return this.prisma.topic.findMany({
      where: { classId },
      orderBy: { orderIndex: 'asc' },
    });
  }

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

  async update(userId: string, topicId: string, dto: UpdateTopicDto) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) throw new NotFoundException('Topic does not exist');

    if (topic.createdBy !== userId) {
      throw new ForbiddenException('No permission');
    }

    return this.prisma.topic.update({
      where: { id: topicId },
      data: dto,
    });
  }

  // Delete topic with all resources
  async delete(userId: string, topicId: string) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) throw new NotFoundException('Topic does not exist');

    if (topic.createdBy !== userId) {
      throw new ForbiddenException('No permission');
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

  /** HELPER: Check teacher is administrator of class */
  private async checkTeacher(userId: string, classId: string) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { userId, classId },
    });

    if (!enrollment || enrollment.roleIn !== 'teacher') {
      throw new ForbiddenException('You are not teacher of class');
    }
  }
}
