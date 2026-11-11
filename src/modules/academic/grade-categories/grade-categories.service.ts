import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { checkTeacherPermission } from '../utils/academic-permission.util';
import { CreateGradeCategoryDto } from './dto/create-grade-category.dto';
import { UpdateGradeCategoryDto } from './dto/update-grade-category.dto';
import { GradeCategoryEntity } from './entities/grade-category.entity';

@Injectable()
export class GradeCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  // Retrieves all grade categories for a class, auto-initializing 3 default categories if none exist
  async getCategories(classId: string): Promise<GradeCategoryEntity[]> {
    await this.findClassOrThrow(classId);

    await this.ensureDefaultCategories(classId);

    return this.prisma.gradeCategory.findMany({
      where: { classId },
      orderBy: { orderIndex: 'asc' },
    });
  }

  // Creates a new grade category for the class
  async createCategory(
    userId: string,
    userRole: string,
    classId: string,
    dto: CreateGradeCategoryDto,
  ): Promise<GradeCategoryEntity> {
    await checkTeacherPermission(
      this.prisma,
      userId,
      classId,
      userRole,
      'You are not authorized to manage grade categories for this class',
    );

    let orderIndex: number = (dto.orderIndex as number) ?? 0;
    if (dto.orderIndex === undefined) {
      const lastCategory = await this.prisma.gradeCategory.findFirst({
        where: { classId },
        orderBy: { orderIndex: 'desc' },
        select: { orderIndex: true },
      });
      orderIndex = (lastCategory ? Number(lastCategory.orderIndex) : 0) + 1;
    }

    return this.prisma.gradeCategory.create({
      data: {
        name: dto.name.trim(),
        weight: dto.weight,
        orderIndex,
        classId,
      },
    });
  }

  // Updates an existing grade category name, weight, or orderIndex
  async updateCategory(
    userId: string,
    userRole: string,
    classId: string,
    categoryId: string,
    dto: UpdateGradeCategoryDto,
  ): Promise<GradeCategoryEntity> {
    await checkTeacherPermission(
      this.prisma,
      userId,
      classId,
      userRole,
      'You are not authorized to manage grade categories for this class',
    );

    const category = await this.prisma.gradeCategory.findFirst({
      where: { id: categoryId, classId },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException('Grade category not found');
    }

    return this.prisma.gradeCategory.update({
      where: { id: categoryId },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.weight !== undefined && { weight: dto.weight }),
        ...(dto.orderIndex !== undefined && {
          orderIndex: dto.orderIndex,
        }),
      },
    });
  }

  // Deletes a grade category and its associated grades
  async deleteCategory(
    userId: string,
    userRole: string,
    classId: string,
    categoryId: string,
  ): Promise<{ success: boolean; message: string }> {
    await checkTeacherPermission(
      this.prisma,
      userId,
      classId,
      userRole,
      'You are not authorized to manage grade categories for this class',
    );

    const category = await this.prisma.gradeCategory.findFirst({
      where: { id: categoryId, classId },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException('Grade category not found');
    }

    await this.prisma.$transaction([
      this.prisma.grade.deleteMany({
        where: { categoryId },
      }),
      this.prisma.gradeCategory.delete({
        where: { id: categoryId },
      }),
    ]);

    return {
      success: true,
      message: 'Grade category deleted successfully',
    };
  }

  // Auto-creates 3 default categories if the classroom currently has none
  async ensureDefaultCategories(classId: string): Promise<void> {
    const count = await this.prisma.gradeCategory.count({
      where: { classId },
    });

    if (count === 0) {
      await this.prisma.gradeCategory.createMany({
        data: [
          { name: 'Chuyên cần', weight: 0.2, orderIndex: 1, classId },
          { name: 'Giữa kì', weight: 0.3, orderIndex: 2, classId },
          { name: 'Cuối kì', weight: 0.5, orderIndex: 3, classId },
        ],
      });
    }
  }

  // Verifies whether class exists in the database
  private async findClassOrThrow(classId: string): Promise<void> {
    const classroom = await this.prisma.class.findUnique({
      where: { id: classId },
      select: { id: true },
    });

    if (!classroom) {
      throw new NotFoundException('Class not found');
    }
  }
}
