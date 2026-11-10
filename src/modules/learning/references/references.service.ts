import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { CreateReferenceDto } from './dto/create-reference.dto';
import { UpdateReferenceDto } from './dto/update-reference.dto';

/**
 * Service orchestrating learning reference link operations and authorization checks.
 */
@Injectable()
export class ReferencesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new reference document or link under a topic.
   */
  async create(userId: string, topicId: string, dto: CreateReferenceDto) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      throw new NotFoundException('Topic does not exist');
    }

    await this.checkTeacher(userId, topic.classId);

    const reference = await this.prisma.reference.create({
      data: {
        title: dto.title,
        url: dto.url,
        description: dto.description,
        topicId,
      },
    });

    return {
      message: 'Create reference successful',
      data: reference,
    };
  }

  /**
   * Retrieves all reference links under a topic.
   */
  async findAllByTopic(topicId: string) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      throw new NotFoundException('Topic does not exist');
    }

    return this.prisma.reference.findMany({
      where: { topicId },
      orderBy: { title: 'asc' },
    });
  }

  /**
   * Retrieves details of a specific reference by ID.
   */
  async findOne(id: string) {
    const reference = await this.prisma.reference.findUnique({
      where: { id },
    });

    if (!reference) {
      throw new NotFoundException('Reference does not exist');
    }

    return reference;
  }

  /**
   * Updates an existing reference's metadata or URL.
   */
  async update(userId: string, id: string, dto: UpdateReferenceDto) {
    const reference = await this.prisma.reference.findUnique({
      where: { id },
      include: { topic: true },
    });

    if (!reference) {
      throw new NotFoundException('Reference does not exist');
    }

    await this.checkTeacher(userId, reference.topic.classId);

    const updated = await this.prisma.reference.update({
      where: { id },
      data: dto,
    });

    return {
      message: 'Update reference successful',
      data: updated,
    };
  }

  /**
   * Removes a reference link from the database.
   */
  async delete(userId: string, id: string) {
    const reference = await this.prisma.reference.findUnique({
      where: { id },
      include: { topic: true },
    });

    if (!reference) {
      throw new NotFoundException('Reference does not exist');
    }

    await this.checkTeacher(userId, reference.topic.classId);

    await this.prisma.reference.delete({
      where: { id },
    });

    return {
      message: 'Delete reference successful',
    };
  }

  /**
   * Validates if the user is an authorized instructor for the class.
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
