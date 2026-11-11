import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { Role } from 'src/generated/prisma/enums';
import { GradeCategoriesService } from '../grade-categories/grade-categories.service';
import { GradesService } from './grades.service';

jest.mock('src/modules/academic/utils/academic-permission.util', () => ({
  checkTeacherPermission: jest.fn().mockResolvedValue({}),
}));

describe('GradesService', () => {
  let service: GradesService;

  const prismaMock = {
    gradeCategory: {
      findMany: jest.fn(),
    },
    enrollment: {
      findMany: jest.fn(),
    },
    grade: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    assignment: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const gradeCategoriesServiceMock = {
    ensureDefaultCategories: jest.fn(),
  };

  const mockClassId = '11111111-1111-1111-1111-111111111111';
  const mockTeacherId = '22222222-2222-2222-2222-222222222222';
  const mockStudentId = '33333333-3333-3333-3333-333333333333';
  const mockCatId1 = '44444444-4444-4444-4444-444444444441';
  const mockCatId2 = '44444444-4444-4444-4444-444444444442';

  beforeEach(async () => {
    jest.clearAllMocks();

    prismaMock.$transaction.mockImplementation(
      async (cbOrArr: ((tx: unknown) => Promise<unknown>) | unknown[]) => {
        if (typeof cbOrArr === 'function') {
          return cbOrArr(prismaMock);
        }
        return cbOrArr;
      },
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GradesService,
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: GradeCategoriesService,
          useValue: gradeCategoriesServiceMock,
        },
      ],
    }).compile();

    service = module.get<GradesService>(GradesService);
  });

  describe('getGradeMatrix', () => {
    it('should calculate matrix rows, finalScore, letterGrade and KPIs', async () => {
      gradeCategoriesServiceMock.ensureDefaultCategories.mockResolvedValue(
        undefined,
      );

      prismaMock.gradeCategory.findMany.mockResolvedValue([
        { id: mockCatId1, name: 'Chuyên cần', weight: 0.2 },
        { id: mockCatId2, name: 'Cuối kì', weight: 0.8 },
      ]);

      prismaMock.enrollment.findMany.mockResolvedValue([
        {
          user: {
            id: mockStudentId,
            fullName: 'Nguyen Van A',
            email: 'a@example.com',
            identityCode: 'SV01',
            avatarUrl: null,
          },
        },
      ]);

      prismaMock.grade.findMany.mockResolvedValue([
        { studentId: mockStudentId, categoryId: mockCatId1, score: 10 },
        { studentId: mockStudentId, categoryId: mockCatId2, score: 8 },
      ]);

      const result = await service.getGradeMatrix(
        mockTeacherId,
        Role.teacher,
        mockClassId,
      );

      expect(result.totalStudents).toBe(1);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].finalScore).toBe(8.4);
      expect(result.rows[0].letterGrade).toBe('B');
      expect(result.rows[0].gpa4).toBe(3.4);
      expect(result.averageScore).toBe('8.40');
      expect(result.passingRate).toBe(100);
    });

    it('should leave finalScore and letterGrade as null if student has no scores yet', async () => {
      gradeCategoriesServiceMock.ensureDefaultCategories.mockResolvedValue(
        undefined,
      );

      prismaMock.gradeCategory.findMany.mockResolvedValue([
        { id: mockCatId1, name: 'Chuyên cần', weight: 0.2 },
      ]);

      prismaMock.enrollment.findMany.mockResolvedValue([
        {
          user: {
            id: mockStudentId,
            fullName: 'Nguyen Van B',
            email: 'b@example.com',
            identityCode: 'SV02',
            avatarUrl: null,
          },
        },
      ]);

      prismaMock.grade.findMany.mockResolvedValue([]);

      const result = await service.getGradeMatrix(
        mockTeacherId,
        Role.teacher,
        mockClassId,
      );

      expect(result.rows[0].finalScore).toBeNull();
      expect(result.rows[0].letterGrade).toBeNull();
      expect(result.rows[0].gpa4).toBeNull();
      expect(result.averageScore).toBe('-');
      expect(result.passingRate).toBe(0);
    });
  });

  describe('batchUpdateGrades', () => {
    it('should update existing grades and create non-existing grades in a transaction', async () => {
      prismaMock.gradeCategory.findMany.mockResolvedValue([
        { id: mockCatId1 },
        { id: mockCatId2 },
      ]);

      prismaMock.grade.findFirst
        .mockResolvedValueOnce({ id: 'grade-1' })
        .mockResolvedValueOnce(null);

      prismaMock.$transaction.mockResolvedValue([{}, {}]);

      const result = await service.batchUpdateGrades(
        mockTeacherId,
        Role.teacher,
        mockClassId,
        {
          updates: [
            { studentId: mockStudentId, categoryId: mockCatId1, score: 9 },
            { studentId: mockStudentId, categoryId: mockCatId2, score: 7 },
          ],
        },
      );

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
      expect(prismaMock.$transaction).toHaveBeenCalled();
    });
  });

  describe('getMyGradeRecord', () => {
    it('should throw NotFoundException if target student does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.getMyGradeRecord(mockStudentId, Role.student, mockClassId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return detailed student grade record with GPA 4.0 conversion', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: mockStudentId,
        fullName: 'Tran Van B',
        email: 'b@example.com',
        identityCode: 'SV02',
        avatarUrl: null,
      });

      gradeCategoriesServiceMock.ensureDefaultCategories.mockResolvedValue(
        undefined,
      );

      prismaMock.gradeCategory.findMany.mockResolvedValue([
        { id: mockCatId1, name: 'Chuyên cần', weight: 0.2 },
        { id: mockCatId2, name: 'Cuối kì', weight: 0.8 },
      ]);

      prismaMock.grade.findMany.mockResolvedValue([
        { studentId: mockStudentId, categoryId: mockCatId1, score: 9 },
        { studentId: mockStudentId, categoryId: mockCatId2, score: 9 },
      ]);

      prismaMock.assignment.findMany.mockResolvedValue([
        {
          id: 'assign-1',
          title: 'Bài tập 1',
          submissions: [
            {
              id: 'sub-1',
              score: 8.5,
              feedback: 'Good',
              submittedAt: new Date('2026-11-01'),
            },
          ],
        },
      ]);

      const result = await service.getMyGradeRecord(
        mockStudentId,
        Role.student,
        mockClassId,
      );

      expect(result.studentName).toBe('Tran Van B');
      expect(result.finalScore).toBe(9.0);
      expect(result.gpa4).toBe(3.6);
      expect(result.letterGrade).toBe('A');
      expect(result.isPassed).toBe(true);
    });
  });
});
