import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { Role } from 'src/generated/prisma/enums';
import { GradebookService } from './gradebook.service';
import { CategoriesService } from '../categories/categories.service';

describe('GradebookService', () => {
  let service: GradebookService;

  const prismaMock = {
    class: {
      findUnique: jest.fn(),
    },
    enrollment: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    gradeCategory: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    grade: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    assignment: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    meetingSession: {
      count: jest.fn(),
    },
    meetingAttendance: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    material: {
      count: jest.fn(),
    },
    materialProgress: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    submission: {
      count: jest.fn(),
    },
    quizPublication: {
      count: jest.fn(),
    },
    quizAttempt: {
      count: jest.fn(),
    },
  };

  const categoriesServiceMock = {
    ensureDefaultCategories: jest.fn(),
  };

  const mockClassId = '11111111-1111-1111-1111-111111111111';
  const mockStudentId = '33333333-3333-3333-3333-333333333333';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GradebookService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: CategoriesService, useValue: categoriesServiceMock },
      ],
    }).compile();

    service = module.get<GradebookService>(GradebookService);
  });

  describe('getGradeMatrix', () => {
    it('should return grade matrix with calculations', async () => {
      prismaMock.gradeCategory.findMany.mockResolvedValue([
        { id: 'cat-1', name: 'Attendance', weight: 0.2, orderIndex: 1 },
      ]);
      prismaMock.enrollment.findMany.mockResolvedValue([
        {
          user: {
            id: mockStudentId,
            fullName: 'Student A',
            email: 'a@test.com',
            identityCode: 'SV01',
            avatarUrl: null,
          },
        },
      ]);
      prismaMock.grade.findMany.mockResolvedValue([
        { studentId: mockStudentId, categoryId: 'cat-1', score: 9.0 },
      ]);

      const result = await service.getGradeMatrix(mockClassId);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].finalScore).toBe(1.8);
      expect(result.averageScore).toBe('1.80');
    });
  });

  describe('getMyGradeRecord', () => {
    it('should throw NotFoundException if student does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.getMyGradeRecord(mockStudentId, Role.student, mockClassId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return grade record with categories and assignments', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: mockStudentId,
        fullName: 'Student A',
        email: 'a@test.com',
        identityCode: 'SV01',
        avatarUrl: null,
      });
      prismaMock.gradeCategory.findMany.mockResolvedValue([
        { id: 'cat-1', name: 'Attendance', weight: 0.2 },
      ]);
      prismaMock.grade.findMany.mockResolvedValue([
        { categoryId: 'cat-1', score: 8.0 },
      ]);
      prismaMock.assignment.findMany.mockResolvedValue([
        {
          id: 'assign-1',
          title: 'Assignment 1',
          submissions: [
            { score: 9.0, feedback: 'Good', submittedAt: new Date() },
          ],
        },
      ]);

      const result = await service.getMyGradeRecord(
        mockStudentId,
        Role.student,
        mockClassId,
      );

      expect(result.studentName).toBe('Student A');
      expect(result.categoryGrades).toHaveLength(1);
      expect(result.detailedItems).toHaveLength(1);
      expect(result.detailedItems[0].status).toBe('graded');
    });
  });
});
