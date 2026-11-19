import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { checkTeacherPermission } from 'src/modules/academic/utils/academic-permission.util';

@Injectable()
export class MaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  // Creates a new material under an existing topic.
  async create(userId: string, topicId: string, dto: CreateMaterialDto) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      throw new NotFoundException('Topic does not exist');
    }

    await this.checkTeacher(userId, topic.classId);

    const hasExternal = Boolean(dto.externalUrl);
    const material = await this.prisma.material.create({
      data: {
        title: dto.title,
        materialType: dto.materialType,
        fileUrl: hasExternal ? null : (dto.fileUrl ?? null),
        externalUrl: hasExternal ? dto.externalUrl : null,
        topicId,
      },
    });

    return {
      message: 'Create material successful',
      data: material,
    };
  }

  // Retrieves all materials belonging to a topic.
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

  // Retrieves a single material by its ID.
  async findOne(id: string) {
    const material = await this.prisma.material.findUnique({
      where: { id },
    });

    if (!material) {
      throw new NotFoundException('Material does not exist');
    }

    return material;
  }

  // Updates an existing material's metadata.
  async update(userId: string, id: string, dto: UpdateMaterialDto) {
    const material = await this.prisma.material.findUnique({
      where: { id },
      include: { topic: true },
    });

    if (!material) {
      throw new NotFoundException('Material does not exist');
    }

    await this.checkTeacher(userId, material.topic.classId);

    const dataToUpdate: Record<string, unknown> = {};
    if (dto.title !== undefined) {
      dataToUpdate.title = dto.title;
    }
    if (dto.materialType !== undefined) {
      dataToUpdate.materialType = dto.materialType;
    }

    if (dto.externalUrl) {
      dataToUpdate.externalUrl = dto.externalUrl;
      dataToUpdate.fileUrl = null;
    } else if (dto.fileUrl) {
      dataToUpdate.fileUrl = dto.fileUrl;
      dataToUpdate.externalUrl = null;
    } else {
      if (dto.fileUrl === null) dataToUpdate.fileUrl = null;
      if (dto.externalUrl === null) dataToUpdate.externalUrl = null;
    }

    const updatedMaterial = await this.prisma.material.update({
      where: { id },
      data: dataToUpdate,
    });

    return {
      message: 'Update material successful',
      data: updatedMaterial,
    };
  }

  // Removes a material from storage and database.
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

  // Tracks student reading progress and completion status for a material
  async trackProgress(
    studentId: string,
    materialId: string,
    isCompleted: boolean = true,
  ) {
    const material = await this.prisma.material.findUnique({
      where: { id: materialId },
    });

    if (!material) {
      throw new NotFoundException('Material does not exist');
    }

    const progress = await this.prisma.materialProgress.upsert({
      where: {
        materialId_studentId: { materialId, studentId },
      },
      create: {
        materialId,
        studentId,
        isCompleted,
        lastViewedAt: new Date(),
      },
      update: {
        isCompleted,
        lastViewedAt: new Date(),
      },
    });

    return progress;
  }

  // Retrieves all material completion records of student for a classroom
  async getMyClassProgress(studentId: string, classId: string) {
    return this.prisma.materialProgress.findMany({
      where: {
        studentId,
        material: {
          topic: {
            classId,
          },
        },
      },
      select: {
        materialId: true,
        isCompleted: true,
        lastViewedAt: true,
      },
    });
  }

  // Validates if the user is an authorized instructor for the class.
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
