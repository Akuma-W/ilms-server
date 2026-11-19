import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { CalculationsService } from './calculations.service';

describe('CalculationsService', () => {
  let service: CalculationsService;

  const prismaMock = {
    class: {
      findUnique: jest.fn(),
    },
    enrollment: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    gradeCategory: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    grade: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    material: {
      count: jest.fn(),
    },
    meetingAttendance: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    materialProgress: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockClassId = '11111111-1111-1111-1111-111111111111';
  const mockCategoryId = '33333333-3333-3333-3333-333333333333';
  const mockStudentId = '44444444-4444-4444-4444-444444444444';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalculationsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<CalculationsService>(CalculationsService);
  });

  describe('batchUpdateGrades', () => {
    it('should update grades successfully', async () => {
      prismaMock.gradeCategory.findMany.mockResolvedValue([
        { id: mockCategoryId },
      ]);
      prismaMock.$transaction.mockImplementation(
        (callback: (tx: typeof prismaMock) => Promise<unknown>) =>
          callback(prismaMock),
      );
      prismaMock.grade.findFirst.mockResolvedValue({ id: 'grade-1' });
      prismaMock.grade.update.mockResolvedValue({ id: 'grade-1', score: 9.0 });

      const result = await service.batchUpdateGrades(mockClassId, {
        updates: [
          {
            studentId: mockStudentId,
            categoryId: mockCategoryId,
            score: 9.0,
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
    });
  });

  describe('overrideGrade', () => {
    it('should override grade when called', async () => {
      prismaMock.gradeCategory.findFirst.mockResolvedValue({
        id: mockCategoryId,
        classId: mockClassId,
      });
      prismaMock.enrollment.findUnique.mockResolvedValue({
        classId: mockClassId,
        userId: mockStudentId,
      });
      prismaMock.grade.findUnique.mockResolvedValue({
        id: 'grade-1',
        rawScore: 7.0,
      });
      prismaMock.grade.update.mockResolvedValue({
        id: 'grade-1',
        studentId: mockStudentId,
        categoryId: mockCategoryId,
        rawScore: 7.0,
        overrideScore: 8.5,
        score: 8.5,
        isOverridden: true,
        overrideReason: 'Bonus',
      });

      const result = await service.overrideGrade(mockClassId, {
        studentId: mockStudentId,
        categoryId: mockCategoryId,
        score: 8.5,
        reason: 'Bonus',
      });

      expect(result.score).toBe(8.5);
      expect(result.isOverridden).toBe(true);
    });
  });
});
