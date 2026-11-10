import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

/**
 * Service orchestrating learning material operations and authorization checks.
 */
@Injectable()
export class MaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new material under an existing topic.
   */
  async create(userId: string, topicId: string, dto: CreateMaterialDto) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      throw new NotFoundException('Topic does not exist');
    }

    await this.checkTeacher(userId, topic.classId);

    const material = await this.prisma.material.create({
      data: {
        title: dto.title,
        materialType: dto.materialType,
        fileUrl: dto.fileUrl,
        externalUrl: dto.externalUrl,
        topicId,
      },
    });

    return {
      message: 'Create material successful',
      data: material,
    };
  }

  /**
   * Retrieves all materials belonging to a topic.
   */
  async findAllByTopic(topicId: string) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      throw new NotFoundException('Topic does not exist');
    }

    return this.prisma.material.findMany({
      where: { topicId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Retrieves a single material by its ID.
   */
  async findOne(id: string) {
    const material = await this.prisma.material.findUnique({
      where: { id },
    });

    if (!material) {
      throw new NotFoundException('Material does not exist');
    }

    return material;
  }

  /**
   * Updates an existing material's metadata.
   */
  async update(userId: string, id: string, dto: UpdateMaterialDto) {
    const material = await this.prisma.material.findUnique({
      where: { id },
      include: { topic: true },
    });

    if (!material) {
      throw new NotFoundException('Material does not exist');
    }

    await this.checkTeacher(userId, material.topic.classId);

    const updatedMaterial = await this.prisma.material.update({
      where: { id },
      data: dto,
    });

    return {
      message: 'Update material successful',
      data: updatedMaterial,
    };
  }

  /**
   * Removes a material from storage and database.
   */
  async delete(userId: string, id: string) {
    const material = await this.prisma.material.findUnique({
      where: { id },
      include: { topic: true },
    });

    if (!material) {
      throw new NotFoundException('Material does not exist');
    }

    await this.checkTeacher(userId, material.topic.classId);

    await this.prisma.material.delete({
      where: { id },
    });

    return {
      message: 'Delete material successful',
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
