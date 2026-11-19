import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { CategoriesService } from './categories.service';

describe('CategoriesService', () => {
  let service: CategoriesService;

  const prismaMock = {
    class: {
      findUnique: jest.fn(),
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
  const mockCategoryId = '33333333-3333-3333-3333-333333333333';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
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
          name: 'Attendance',
          weight: 0.2,
          classId: mockClassId,
        },
      ]);

      const result = await service.getCategories(mockClassId);

      expect(prismaMock.gradeCategory.createMany).toHaveBeenCalledWith({
        data: [
          {
            name: 'Attendance',
            weight: 0.2,
            orderIndex: 1,
            classId: mockClassId,
            sourceType: 'attendance',
          },
          {
            name: 'Midterm',
            weight: 0.3,
            orderIndex: 2,
            classId: mockClassId,
            sourceType: 'manual',
          },
          {
            name: 'Final',
            weight: 0.5,
            orderIndex: 3,
            classId: mockClassId,
            sourceType: 'manual',
          },
        ],
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('createCategory', () => {
    it('should create category successfully', async () => {
      prismaMock.gradeCategory.create.mockResolvedValue({
        id: mockCategoryId,
        name: 'Assignment',
        weight: 0.2,
        classId: mockClassId,
      });

      const result = await service.createCategory(mockClassId, {
        name: 'Assignment',
        weight: 0.2,
      });

      expect(result.name).toBe('Assignment');
      expect(prismaMock.gradeCategory.create).toHaveBeenCalled();
    });
  });

  describe('updateCategory', () => {
    it('should throw NotFoundException if category does not exist in class', async () => {
      prismaMock.gradeCategory.findFirst.mockResolvedValue(null);

      await expect(
        service.updateCategory(mockClassId, mockCategoryId, {
          name: 'Updated',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update category when found', async () => {
      prismaMock.gradeCategory.findFirst.mockResolvedValue({
        id: mockCategoryId,
        classId: mockClassId,
      });
      prismaMock.gradeCategory.update.mockResolvedValue({
        id: mockCategoryId,
        name: 'Updated Final',
        weight: 0.5,
      });

      const result = await service.updateCategory(mockClassId, mockCategoryId, {
        name: 'Updated Final',
      });

      expect(result.name).toBe('Updated Final');
    });
  });

  describe('deleteCategory', () => {
    it('should delete category and associated grades in a transaction', async () => {
      prismaMock.gradeCategory.findFirst.mockResolvedValue({
        id: mockCategoryId,
        classId: mockClassId,
      });
      prismaMock.$transaction.mockResolvedValue([{}, {}]);

      const result = await service.deleteCategory(mockClassId, mockCategoryId);

      expect(result.success).toBe(true);
      expect(prismaMock.$transaction).toHaveBeenCalled();
    });
  });
});
