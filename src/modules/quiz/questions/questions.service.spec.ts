import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { QuestionsService } from './questions.service';

describe('QuestionsService', () => {
  let service: QuestionsService;

  const mockPrisma = {
    quiz: {
      findUnique: jest.fn(),
    },
    question: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    option: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    quizAnswer: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPrisma.$transaction.mockImplementation(
      async (cbOrArr: ((tx: unknown) => Promise<unknown>) | unknown[]) => {
        if (typeof cbOrArr === 'function') {
          return cbOrArr(mockPrisma);
        }
        return cbOrArr;
      },
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<QuestionsService>(QuestionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createQuestion', () => {
    it('should create question and options under quiz', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue({
        id: 'quiz-1',
        createdBy: 'user-1',
      });
      mockPrisma.question.count.mockResolvedValue(2);
      mockPrisma.question.create.mockResolvedValue({ id: 'q-1' });
      mockPrisma.question.findUnique.mockResolvedValue({
        id: 'q-1',
        content: 'Question 1',
        options: [{ id: 'opt-1', content: 'A' }],
      });

      const result = await service.createQuestion('user-1', 'quiz-1', {
        content: 'Question 1',
        questionType: 'multiple_choice',
        options: [
          { content: 'A', isCorrect: true },
          { content: 'B', isCorrect: false },
        ],
      });

      expect(mockPrisma.question.create).toHaveBeenCalled();
      expect(mockPrisma.option.createMany).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('batchCreateQuestions', () => {
    it('should create multiple questions and return created items', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue({
        id: 'quiz-1',
        createdBy: 'user-1',
      });
      mockPrisma.question.count.mockResolvedValue(0);
      mockPrisma.question.create.mockResolvedValue({ id: 'q-1' });
      mockPrisma.question.findMany.mockResolvedValue([
        { id: 'q-1', options: [] },
        { id: 'q-2', options: [] },
      ]);

      const result = await service.batchCreateQuestions('user-1', 'quiz-1', [
        {
          content: 'Q1',
          questionType: 'multiple_choice',
          options: [
            { content: 'A', isCorrect: true },
            { content: 'B', isCorrect: false },
          ],
        },
        {
          content: 'Q2',
          questionType: 'true_false',
          options: [
            { content: 'True', isCorrect: true },
            { content: 'False', isCorrect: false },
          ],
        },
      ]);

      expect(result).toHaveLength(2);
      expect(mockPrisma.question.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateQuestion', () => {
    it('should throw NotFoundException if question does not exist', async () => {
      mockPrisma.question.findUnique.mockResolvedValue(null);

      await expect(
        service.updateQuestion('user-1', 'q-non-existent', { content: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update question content and replace options', async () => {
      mockPrisma.question.findUnique
        .mockResolvedValueOnce({ id: 'q-1', quizId: 'quiz-1' })
        .mockResolvedValueOnce({ id: 'q-1', content: 'New Content' });
      mockPrisma.quiz.findUnique.mockResolvedValue({
        id: 'quiz-1',
        createdBy: 'user-1',
      });

      const result = await service.updateQuestion('user-1', 'q-1', {
        content: 'New Content',
        options: [
          { content: 'Opt1', isCorrect: true },
          { content: 'Opt2', isCorrect: false },
        ],
      });

      expect(mockPrisma.option.deleteMany).toHaveBeenCalledWith({
        where: { questionId: 'q-1' },
      });
      expect(mockPrisma.option.createMany).toHaveBeenCalled();
      expect(mockPrisma.question.update).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('deleteQuestion', () => {
    it('should delete associated answers, options and question', async () => {
      mockPrisma.question.findUnique.mockResolvedValue({
        id: 'q-1',
        quizId: 'quiz-1',
      });
      mockPrisma.quiz.findUnique.mockResolvedValue({
        id: 'quiz-1',
        createdBy: 'user-1',
      });

      await service.deleteQuestion('user-1', 'q-1');

      expect(mockPrisma.quizAnswer.deleteMany).toHaveBeenCalledWith({
        where: { questionId: 'q-1' },
      });
      expect(mockPrisma.option.deleteMany).toHaveBeenCalledWith({
        where: { questionId: 'q-1' },
      });
      expect(mockPrisma.question.delete).toHaveBeenCalledWith({
        where: { id: 'q-1' },
        include: { options: true },
      });
    });
  });

  describe('reorderQuestions', () => {
    it('should update orderIndex for all given questions', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue({
        id: 'quiz-1',
        createdBy: 'user-1',
      });
      mockPrisma.question.update.mockResolvedValue({});
      mockPrisma.question.findMany.mockResolvedValue([
        { id: 'q-1', orderIndex: 1 },
      ]);

      const result = await service.reorderQuestions('user-1', 'quiz-1', {
        orders: [
          { questionId: 'q-1', orderIndex: 2 },
          { questionId: 'q-2', orderIndex: 1 },
        ],
      });

      expect(mockPrisma.question.update).toHaveBeenCalledTimes(2);
      expect(result).toBeDefined();
    });
  });
});
