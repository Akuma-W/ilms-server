import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { QuizzesService } from './quizzes.service';

describe('QuizzesService', () => {
  let service: QuizzesService;

  const mockPrisma = {
    quiz: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    question: { findMany: jest.fn(), deleteMany: jest.fn(), create: jest.fn() },
    option: { deleteMany: jest.fn(), createMany: jest.fn() },
    quizAnswer: { deleteMany: jest.fn() },
    quizAttempt: { count: jest.fn(), deleteMany: jest.fn() },
    quizPublication: { deleteMany: jest.fn() },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPrisma.$transaction.mockImplementation(
      async (cbOrArr: ((tx: unknown) => Promise<unknown>) | unknown[]) =>
        typeof cbOrArr === 'function' ? cbOrArr(mockPrisma) : cbOrArr,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizzesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<QuizzesService>(QuizzesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createQuiz', () => {
    it('should create a quiz with default values', async () => {
      const createdQuiz = {
        id: 'quiz-1',
        title: 'Network Test',
        timeLimit: 30,
        visibility: 'private',
        status: 'draft',
        createdBy: 'user-1',
        totalQuestions: 0,
      };
      mockPrisma.quiz.create.mockResolvedValue(createdQuiz);

      const result = await service.createQuiz('user-1', {
        title: 'Network Test',
        timeLimit: 30,
      });

      expect(mockPrisma.quiz.create).toHaveBeenCalled();
      expect(result).toEqual(createdQuiz);
    });
  });

  describe('getQuizzes', () => {
    it('should return paginated list of quizzes for user scope', async () => {
      const items = [
        {
          id: 'quiz-1',
          title: 'Q1',
          _count: { questions: 8, attempts: 13 },
        },
      ];
      mockPrisma.quiz.findMany.mockResolvedValue(items);
      mockPrisma.quiz.count.mockResolvedValue(1);

      const result = await service.getQuizzes('user-1', {
        scope: 'my',
        page: 1,
        limit: 10,
      });

      expect(mockPrisma.quiz.findMany).toHaveBeenCalledWith({
        where: { createdBy: 'user-1' },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: { select: { id: true, fullName: true, avatarUrl: true } },
          _count: { select: { questions: true, attempts: true } },
        },
      });
      expect(mockPrisma.quiz.count).toHaveBeenCalled();
      expect(result.items[0]).toMatchObject({
        id: 'quiz-1',
        totalQuestions: 8,
        attemptCount: 13,
      });
      expect(result.meta.total).toBe(1);
    });

    it('should filter by search keyword', async () => {
      mockPrisma.quiz.findMany.mockResolvedValue([]);
      mockPrisma.quiz.count.mockResolvedValue(0);

      await service.getQuizzes('user-1', { search: 'biology' });

      expect(mockPrisma.quiz.findMany).toHaveBeenCalled();
    });

    it('should expose only published public quizzes outside personal scope', async () => {
      mockPrisma.quiz.findMany.mockResolvedValue([]);
      mockPrisma.quiz.count.mockResolvedValue(0);

      await service.getQuizzes('user-1', { scope: 'all' });

      const expectedWhere = { visibility: 'public', status: 'published' };
      expect(mockPrisma.quiz.findMany).toHaveBeenCalledWith({
        where: expectedWhere,
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: { select: { id: true, fullName: true, avatarUrl: true } },
          _count: { select: { questions: true, attempts: true } },
        },
      });
      expect(mockPrisma.quiz.count).toHaveBeenCalledWith({
        where: expectedWhere,
      });
    });
  });

  describe('getQuizById', () => {
    it('should throw NotFoundException when quiz does not exist', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue(null);

      await expect(
        service.getQuizById('user-1', 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when non-owner accesses private quiz', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue({
        id: 'quiz-1',
        visibility: 'private',
        createdBy: 'user-2',
        questions: [],
      });

      await expect(service.getQuizById('user-1', 'quiz-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should mask answers when viewer is not owner of public quiz', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue({
        id: 'quiz-1',
        visibility: 'public',
        status: 'published',
        createdBy: 'user-2',
        questions: [
          {
            id: 'q-1',
            explanation: 'Secret explanation',
            options: [{ id: 'opt-1', content: 'A', isCorrect: true }],
          },
        ],
      });

      const result = await service.getQuizById('user-1', 'quiz-1');

      expect(result.questions[0].explanation).toBeNull();
      expect(result.questions[0].options[0]).not.toHaveProperty('isCorrect');
    });
  });

  describe('updateQuiz', () => {
    it('should update quiz metadata when user is owner', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue({
        id: 'quiz-1',
        createdBy: 'user-1',
      });
      mockPrisma.quiz.update.mockResolvedValue({
        id: 'quiz-1',
        title: 'Updated Title',
      });

      const result = await service.updateQuiz('user-1', 'quiz-1', {
        title: 'Updated Title',
      });

      expect(mockPrisma.quiz.update).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw ForbiddenException when updating non-owned quiz', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue({
        id: 'quiz-1',
        createdBy: 'user-2',
      });

      await expect(
        service.updateQuiz('user-1', 'quiz-1', { title: 'Hacked' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should hide public draft quizzes from non-owners', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue({
        id: 'quiz-1',
        visibility: 'public',
        status: 'draft',
        createdBy: 'user-2',
        questions: [],
      });

      await expect(service.getQuizById('user-1', 'quiz-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('deleteQuiz', () => {
    it('should block deletion when a class attempt has been submitted', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue({
        id: 'quiz-1',
        createdBy: 'user-1',
      });
      mockPrisma.quizAttempt.count.mockResolvedValue(1);

      await expect(service.deleteQuiz('user-1', 'quiz-1')).rejects.toThrow(
        ConflictException,
      );
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('should delete quiz and associated entities in transaction', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue({
        id: 'quiz-1',
        createdBy: 'user-1',
      });
      mockPrisma.quizAttempt.count.mockResolvedValue(0);
      mockPrisma.question.findMany.mockResolvedValue([{ id: 'q-1' }]);
      mockPrisma.quiz.delete.mockResolvedValue({ id: 'quiz-1' });

      await service.deleteQuiz('user-1', 'quiz-1');

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.quiz.delete).toHaveBeenCalledWith({
        where: { id: 'quiz-1' },
      });
    });
  });

  describe('cloneQuiz', () => {
    it('should throw ForbiddenException if cloning private quiz of another user', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue({
        id: 'quiz-1',
        visibility: 'private',
        createdBy: 'user-2',
        questions: [],
      });

      await expect(service.cloneQuiz('user-1', 'quiz-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should not clone public draft quizzes from another owner', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue({
        id: 'quiz-1',
        visibility: 'public',
        status: 'draft',
        createdBy: 'user-2',
        questions: [],
      });

      await expect(service.cloneQuiz('user-1', 'quiz-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should clone public quiz with its questions and options', async () => {
      mockPrisma.quiz.findUnique
        .mockResolvedValueOnce({
          id: 'quiz-1',
          title: 'Original Quiz',
          description: 'Desc',
          timeLimit: 40,
          visibility: 'public',
          status: 'published',
          createdBy: 'user-2',
          questions: [
            {
              id: 'q-1',
              content: 'What is IP?',
              questionType: 'multiple_choice',
              points: 1.0,
              orderIndex: 1,
              explanation: 'Exp',
              options: [{ id: 'opt-1', content: 'Protocol', isCorrect: true }],
            },
          ],
        })
        .mockResolvedValueOnce({
          id: 'quiz-new',
          title: '[Copy] Original Quiz',
        });

      mockPrisma.quiz.create.mockResolvedValue({ id: 'quiz-new' });
      mockPrisma.quiz.findUniqueOrThrow.mockResolvedValue({
        id: 'quiz-new',
        title: '[Copy] Original Quiz',
      });
      mockPrisma.question.create.mockResolvedValue({ id: 'q-new' });

      const result = await service.cloneQuiz('user-1', 'quiz-1');

      expect(mockPrisma.quiz.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});
