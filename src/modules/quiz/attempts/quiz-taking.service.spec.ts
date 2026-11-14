import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { QuizTakingService } from './quiz-taking.service';

describe('QuizTakingService', () => {
  let service: QuizTakingService;

  const mockPrisma = {
    quiz: {
      findUnique: jest.fn(),
    },
    quizPublication: {
      findUnique: jest.fn(),
    },
    enrollment: {
      count: jest.fn(),
    },
    quizAttempt: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    quizAnswer: {
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.quizAttempt.findFirst.mockResolvedValue(null);

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
        QuizTakingService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<QuizTakingService>(QuizTakingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startAttempt', () => {
    it('should throw NotFoundException if quiz does not exist', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue(null);

      await expect(
        service.startAttempt('student-1', 'quiz-none', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if publication is closed', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue({
        id: 'quiz-1',
        questions: [],
      });
      mockPrisma.quizPublication.findUnique.mockResolvedValue({
        id: 'pub-1',
        quizId: 'quiz-1',
        closeAt: new Date(Date.now() - 3600000),
      });

      await expect(
        service.startAttempt('student-1', 'quiz-1', { publicationId: 'pub-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should mask answers and explanation when returning exam questions', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue({
        id: 'quiz-1',
        title: 'Midterm',
        timeLimit: 45,
        visibility: 'public',
        reviewMode: 'after_submission',
        questions: [
          {
            id: 'q-1',
            content: 'Question 1',
            questionType: 'multiple_choice',
            explanation: 'Hidden Explanation',
            points: 1,
            orderIndex: 0,
            options: [
              { id: 'opt-1', content: 'A', isCorrect: true },
              { id: 'opt-2', content: 'B', isCorrect: false },
            ],
          },
        ],
      });
      mockPrisma.quizAttempt.create.mockResolvedValue({
        id: 'att-1',
        startedAt: new Date(),
      });

      const session = await service.startAttempt('student-1', 'quiz-1', {});

      expect(session.attemptId).toBe('att-1');
      expect(session.questions).toHaveLength(1);
      expect(
        (session.questions[0] as unknown as { explanation?: string })
          .explanation,
      ).toBeUndefined();
      expect(
        (session.questions[0].options[0] as unknown as { isCorrect?: boolean })
          .isCorrect,
      ).toBeUndefined();
      expect(session.questions[0].options[0].content).toBe('A');
    });
  });

  describe('checkAnswer', () => {
    it('should return isCorrect true when selected answer is correct', async () => {
      mockPrisma.quizAttempt.findUnique.mockResolvedValue({
        id: 'att-1',
        studentId: 'student-1',
        submittedAt: null,
        quiz: {
          questions: [
            {
              id: 'q-1',
              explanation: 'Because B is right',
              options: [
                { id: 'opt-1', isCorrect: false },
                { id: 'opt-2', isCorrect: true },
              ],
            },
          ],
        },
      });

      const result = await service.checkAnswer('student-1', 'att-1', {
        questionId: 'q-1',
        selectedOptionIds: ['opt-2'],
      });

      expect(result.isCorrect).toBe(true);
      expect(result.correctOptionIds).toEqual(['opt-2']);
      expect(result.explanation).toBe('Because B is right');
    });

    it('should return isCorrect false when selected answer is wrong', async () => {
      mockPrisma.quizAttempt.findUnique.mockResolvedValue({
        id: 'att-1',
        studentId: 'student-1',
        submittedAt: null,
        quiz: {
          questions: [
            {
              id: 'q-1',
              explanation: 'Because B is right',
              options: [
                { id: 'opt-1', isCorrect: false },
                { id: 'opt-2', isCorrect: true },
              ],
            },
          ],
        },
      });

      const result = await service.checkAnswer('student-1', 'att-1', {
        questionId: 'q-1',
        selectedOptionIds: ['opt-1'],
      });

      expect(result.isCorrect).toBe(false);
      expect(result.correctOptionIds).toEqual(['opt-2']);
    });
  });

  describe('submitAttempt', () => {
    it('should grade answers accurately and compute score', async () => {
      mockPrisma.quizAttempt.findUnique.mockResolvedValue({
        id: 'att-1',
        studentId: 'student-1',
        submittedAt: null,
        quizId: 'quiz-1',
        quiz: {
          questions: [
            {
              id: 'q-1',
              points: 10,
              questionType: 'multiple_choice',
              options: [
                { id: 'opt-1', isCorrect: true },
                { id: 'opt-2', isCorrect: false },
              ],
            },
          ],
        },
      });
      mockPrisma.quizAttempt.update.mockResolvedValue({});
      mockPrisma.quizAnswer.createMany.mockResolvedValue({ count: 1 });

      const result = await service.submitAttempt('student-1', 'att-1', {
        answers: [
          {
            questionId: 'q-1',
            selectedOptionIds: ['opt-1'],
          },
        ],
      });

      expect(result.score).toBe(10);
      expect(result.correctCount).toBe(1);
      expect(result.totalQuestions).toBe(1);
    });
  });
});
