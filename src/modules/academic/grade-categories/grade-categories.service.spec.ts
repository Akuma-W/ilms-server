import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { Role } from 'src/generated/prisma/enums';
import { GradeCategoriesService } from './grade-categories.service';

describe('GradeCategoriesService', () => {
  let service: GradeCategoriesService;

  const prismaMock = {
    class: {
      findUnique: jest.fn(),
    },
    enrollment: {
      findFirst: jest.fn(),
    },
    gradeCategory: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    grade: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockClassId = '11111111-1111-1111-1111-111111111111';
  const mockTeacherId = '22222222-2222-2222-2222-222222222222';
  const mockCategoryId = '33333333-3333-3333-3333-333333333333';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GradeCategoriesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<GradeCategoriesService>(GradeCategoriesService);
  });

  describe('getCategories', () => {
    it('should throw NotFoundException when class does not exist', async () => {
      prismaMock.class.findUnique.mockResolvedValue(null);

      await expect(service.getCategories(mockClassId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should initialize default categories and return list', async () => {
      prismaMock.class.findUnique.mockResolvedValue({ id: mockClassId });
      prismaMock.gradeCategory.count.mockResolvedValue(0);
      prismaMock.gradeCategory.createMany.mockResolvedValue({ count: 3 });
      prismaMock.gradeCategory.findMany.mockResolvedValue([
        {
          id: mockCategoryId,
          name: 'Chuyên cần',
          weight: 0.2,
          classId: mockClassId,
        },
      ]);

      const result = await service.getCategories(mockClassId);

      expect(prismaMock.gradeCategory.createMany).toHaveBeenCalledWith({
        data: [
          {
            name: 'Chuyên cần',
            weight: 0.2,
            orderIndex: 1,
            classId: mockClassId,
          },
          {
            name: 'Giữa kì',
            weight: 0.3,
            orderIndex: 2,
            classId: mockClassId,
          },
          {
            name: 'Cuối kì',
            weight: 0.5,
            orderIndex: 3,
            classId: mockClassId,
          },
        ],
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('createCategory', () => {
    it('should throw ForbiddenException if user is not teacher or admin', async () => {
      prismaMock.class.findUnique.mockResolvedValue({
        id: mockClassId,
        teacherId: mockTeacherId,
      });
      prismaMock.enrollment.findFirst.mockResolvedValue(null);

      await expect(
        service.createCategory('student-id', Role.student, mockClassId, {
          name: 'Bài tập',
          weight: 0.2,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create category successfully when user is owner teacher', async () => {
      prismaMock.class.findUnique.mockResolvedValue({
        id: mockClassId,
        teacherId: mockTeacherId,
      });
      prismaMock.gradeCategory.create.mockResolvedValue({
        id: mockCategoryId,
        name: 'Bài tập',
        weight: 0.2,
        classId: mockClassId,
      });

      const result = await service.createCategory(
        mockTeacherId,
        Role.teacher,
        mockClassId,
        { name: 'Bài tập', weight: 0.2 },
      );

      expect(result.name).toBe('Bài tập');
      expect(prismaMock.gradeCategory.create).toHaveBeenCalled();
    });

    it('should create category successfully when user is admin', async () => {
      prismaMock.class.findUnique.mockResolvedValue({
        id: mockClassId,
        teacherId: mockTeacherId,
      });
      prismaMock.gradeCategory.create.mockResolvedValue({
        id: mockCategoryId,
        name: 'Đồ án',
        weight: 0.3,
        classId: mockClassId,
      });

      const result = await service.createCategory(
        'admin-id',
        Role.admin,
        mockClassId,
        { name: 'Đồ án', weight: 0.3 },
      );

      expect(result.name).toBe('Đồ án');
    });
  });

  describe('updateCategory', () => {
    it('should throw NotFoundException if category does not exist in class', async () => {
      prismaMock.class.findUnique.mockResolvedValue({
        id: mockClassId,
        teacherId: mockTeacherId,
      });
      prismaMock.gradeCategory.findFirst.mockResolvedValue(null);

      await expect(
        service.updateCategory(
          mockTeacherId,
          Role.teacher,
          mockClassId,
          mockCategoryId,
          { name: 'Updated' },
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update category when found and authorized', async () => {
      prismaMock.class.findUnique.mockResolvedValue({
        id: mockClassId,
        teacherId: mockTeacherId,
      });
      prismaMock.gradeCategory.findFirst.mockResolvedValue({
        id: mockCategoryId,
        classId: mockClassId,
      });
      prismaMock.gradeCategory.update.mockResolvedValue({
        id: mockCategoryId,
        name: 'Cuối kỳ sửa',
        weight: 0.5,
      });

      const result = await service.updateCategory(
        mockTeacherId,
        Role.teacher,
        mockClassId,
        mockCategoryId,
        { name: 'Cuối kỳ sửa' },
      );

      expect(result.name).toBe('Cuối kỳ sửa');
    });
  });

  describe('deleteCategory', () => {
    it('should delete category and associated grades in a transaction', async () => {
      prismaMock.class.findUnique.mockResolvedValue({
        id: mockClassId,
        teacherId: mockTeacherId,
      });
      prismaMock.gradeCategory.findFirst.mockResolvedValue({
        id: mockCategoryId,
        classId: mockClassId,
      });
      prismaMock.$transaction.mockResolvedValue([{}, {}]);

      const result = await service.deleteCategory(
        mockTeacherId,
        Role.teacher,
        mockClassId,
        mockCategoryId,
      );

      expect(result.success).toBe(true);
      expect(prismaMock.$transaction).toHaveBeenCalled();
    });
  });
});
