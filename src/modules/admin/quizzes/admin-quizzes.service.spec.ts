import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { QuizStatus, ReviewMode, Visibility } from 'src/generated/prisma/enums';
import { AdminQuizzesService } from './admin-quizzes.service';

describe('AdminQuizzesService', () => {
  let service: AdminQuizzesService;

  interface MockPrisma {
    $transaction: jest.Mock;
    quiz: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    question: {
      findMany: jest.Mock;
      deleteMany: jest.Mock;
    };
    option: {
      deleteMany: jest.Mock;
    };
    quizAnswer: {
      deleteMany: jest.Mock;
    };
    quizAttempt: {
      deleteMany: jest.Mock;
    };
    quizPublication: {
      deleteMany: jest.Mock;
    };
  }

  const mockPrismaService: MockPrisma = {
    $transaction: jest.fn((callback: (tx: MockPrisma) => Promise<unknown>) =>
      callback(mockPrismaService),
    ),
    quiz: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    question: {
      findMany: jest.fn().mockResolvedValue([]),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    option: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    quizAnswer: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    quizAttempt: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    quizPublication: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminQuizzesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AdminQuizzesService>(AdminQuizzesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated quizzes for admin', async () => {
      mockPrismaService.quiz.count.mockResolvedValue(1);
      mockPrismaService.quiz.findMany.mockResolvedValue([
        {
          id: 'q-1',
          title: 'Đề thi OOP',
          description: null,
          timeLimit: 60,
          visibility: Visibility.public,
          status: QuizStatus.published,
          reviewMode: ReviewMode.after_submission,
          createdAt: new Date(),
          updatedAt: new Date(),
          creator: {
            id: 'u-1',
            fullName: 'Thầy X',
            email: 'x@edu.vn',
            avatarUrl: null,
          },
          _count: { questions: 20, attempts: 50 },
        },
      ]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].totalQuestions).toBe(20);
      expect(result.data[0].totalAttempts).toBe(50);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('takedown', () => {
    it('should revoke public visibility and switch status to draft', async () => {
      mockPrismaService.quiz.findUnique.mockResolvedValue({
        id: 'q-1',
        title: 'Đề thi OOP',
        description: 'Mô tả ban đầu',
        creator: {
          id: 'u-1',
          fullName: 'Thầy X',
          email: 'x@edu.vn',
          avatarUrl: null,
        },
        _count: { questions: 20, attempts: 50 },
      });
      mockPrismaService.quiz.update.mockResolvedValue({
        id: 'q-1',
        title: 'Đề thi OOP',
        description: 'Mô tả ban đầu\n[Cảnh báo bản quyền: Vi phạm bản quyền]',
        timeLimit: 60,
        visibility: Visibility.private,
        status: QuizStatus.draft,
        reviewMode: ReviewMode.after_submission,
        createdAt: new Date(),
        updatedAt: new Date(),
        creator: {
          id: 'u-1',
          fullName: 'Thầy X',
          email: 'x@edu.vn',
          avatarUrl: null,
        },
        _count: { questions: 20, attempts: 50 },
      });

      const result = await service.takedown('q-1', {
        reason: 'Vi phạm bản quyền',
      });

      expect(result.visibility).toBe(Visibility.private);
      expect(result.status).toBe(QuizStatus.draft);
      expect(mockPrismaService.quiz.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if quiz does not exist', async () => {
      mockPrismaService.quiz.findUnique.mockResolvedValue(null);

      await expect(
        service.takedown('q-999', { reason: 'Lý do' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('forceDelete', () => {
    it('should force delete quiz successfully bypassing ownership', async () => {
      mockPrismaService.quiz.findUnique.mockResolvedValue({ id: 'q-1' });
      mockPrismaService.quiz.delete.mockResolvedValue({});

      const result = await service.forceDelete('q-1');

      expect(result.success).toBe(true);
      expect(mockPrismaService.quiz.delete).toHaveBeenCalledWith({
        where: { id: 'q-1' },
      });
    });
  });
});
