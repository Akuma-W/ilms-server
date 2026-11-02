import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

@Injectable()
export class MaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Create a new material under a topic
  async create(userId: string, topicId: string, dto: CreateMaterialDto) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      throw new NotFoundException('Topic does not exist');
    }

    // Check if the user is the teacher of the class associated with the topic
    await this.checkTeacher(userId, topic.classId);

    const material = await this.prisma.material.create({
      data: {
        title: dto.title,
        materialType: dto.materialType,
        fileUrl: dto.fileUrl,
        externalUrl: dto.externalUrl,
        topicId: topicId,
      },
    });

    return {
      message: 'Create material successful',
      data: material,
    };
  }

  // 2. Find all materials for a topic
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

  // 3. Find one material by ID
  async findOne(id: string) {
    const material = await this.prisma.material.findUnique({
      where: { id },
    });

    if (!material) {
      throw new NotFoundException('Material does not exist');
    }

    return material;
  }

  // 4. Update material metadata
  async update(userId: string, id: string, dto: UpdateMaterialDto) {
    const material = await this.prisma.material.findUnique({
      where: { id },
      include: { topic: true },
    });

    if (!material) {
      throw new NotFoundException('Material does not exist');
    }

    // Check if the user is the teacher of the class associated with the topic
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

  // 5. Delete material
  async delete(userId: string, id: string) {
    const material = await this.prisma.material.findUnique({
      where: { id },
      include: { topic: true },
    });

    if (!material) {
      throw new NotFoundException('Material does not exist');
    }

    // Check if the user is the teacher of the class associated with the topic
    await this.checkTeacher(userId, material.topic.classId);

    await this.prisma.material.delete({
      where: { id },
    });

    return {
      message: 'Delete material successful',
    };
  }

  /** HELPER: Check if user is teacher of the class */
  private async checkTeacher(userId: string, classId: string) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { userId, classId },
    });

    if (!enrollment || enrollment.roleIn !== 'teacher') {
      throw new ForbiddenException('You are not teacher of class');
    }
  }
}
