import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { QuizAttemptsService } from './quiz-attempts.service';

describe('QuizAttemptsService', () => {
  let service: QuizAttemptsService;

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
      update: jest.fn(),
      findMany: jest.fn(),
    },
    quizAnswer: {
      createMany: jest.fn(),
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
        QuizAttemptsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<QuizAttemptsService>(QuizAttemptsService);
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
        questions: [
          {
            id: 'q-1',
            content: 'Question 1',
            questionType: 'multiple_choice',
            explanation: 'Hidden Explanation',
            options: [{ id: 'opt-1', content: 'Choice A', isCorrect: true }],
          },
        ],
      });
      mockPrisma.quizAttempt.create.mockResolvedValue({
        id: 'att-1',
        startedAt: new Date(),
      });

      const result = await service.startAttempt('student-1', 'quiz-1', {});

      expect(result.attemptId).toBe('att-1');
      expect(result.questions[0]).not.toHaveProperty('explanation');
      expect(result.questions[0].options[0]).not.toHaveProperty('isCorrect');
    });
  });

  describe('submitAttempt', () => {
    it('should throw ForbiddenException when submitting another user attempt', async () => {
      mockPrisma.quizAttempt.findUnique.mockResolvedValue({
        id: 'att-1',
        studentId: 'student-2',
      });

      await expect(
        service.submitAttempt('student-1', 'att-1', { answers: [] }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when attempt was already submitted', async () => {
      mockPrisma.quizAttempt.findUnique.mockResolvedValue({
        id: 'att-1',
        studentId: 'student-1',
        submittedAt: new Date(),
      });

      await expect(
        service.submitAttempt('student-1', 'att-1', { answers: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should auto-grade, record score, and return detailed results', async () => {
      mockPrisma.quizAttempt.findUnique.mockResolvedValue({
        id: 'att-1',
        quizId: 'quiz-1',
        studentId: 'student-1',
        submittedAt: null,
        quiz: {
          questions: [
            {
              id: 'q-1',
              points: 1,
              questionType: 'multiple_choice',
              explanation: 'Ex 1',
              options: [
                { id: 'opt-1', isCorrect: true },
                { id: 'opt-2', isCorrect: false },
              ],
            },
          ],
        },
      });

      const result = await service.submitAttempt('student-1', 'att-1', {
        answers: [{ questionId: 'q-1', selectedOptionIds: ['opt-1'] }],
      });

      expect(mockPrisma.quizAttempt.update).toHaveBeenCalled();
      expect(result.score).toBe(10);
      expect(result.correctCount).toBe(1);
      expect(result.details[0].isCorrect).toBe(true);
    });
  });

  describe('getAttemptResult', () => {
    it('should throw BadRequestException if attempt is not submitted yet', async () => {
      mockPrisma.quizAttempt.findUnique.mockResolvedValue({
        id: 'att-1',
        studentId: 'student-1',
        submittedAt: null,
        quiz: { createdBy: 'teacher-1', questions: [] },
        quizAnswers: [],
      });

      await expect(
        service.getAttemptResult('student-1', 'att-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return detailed result review with correct options and student choices', async () => {
      mockPrisma.quizAttempt.findUnique.mockResolvedValue({
        id: 'att-1',
        quizId: 'quiz-1',
        studentId: 'student-1',
        score: 10,
        startedAt: new Date(),
        submittedAt: new Date(),
        quiz: {
          title: 'Quiz 1',
          createdBy: 'teacher-1',
          questions: [
            {
              id: 'q-1',
              points: 1,
              questionType: 'multiple_choice',
              explanation: 'Exp',
              options: [{ id: 'opt-1', isCorrect: true }],
            },
          ],
        },
        quizAnswers: [{ questionId: 'q-1', selectedOption: 'opt-1' }],
      });

      const result = await service.getAttemptResult('student-1', 'att-1');

      expect(result.score).toBe(10);
      expect(result.details[0].selectedOptionIds).toEqual(['opt-1']);
      expect(result.details[0].correctOptionIds).toEqual(['opt-1']);
    });
  });

  describe('getClassPublicationStats', () => {
    it('should throw ForbiddenException if user is not teacher of class', async () => {
      mockPrisma.quizPublication.findUnique.mockResolvedValue({
        id: 'pub-1',
        class: { teacherId: 'teacher-2', enrollments: [] },
        attempts: [],
      });

      await expect(
        service.getClassPublicationStats('teacher-1', 'pub-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should calculate grade distribution and average score correctly', async () => {
      mockPrisma.quizPublication.findUnique.mockResolvedValue({
        id: 'pub-1',
        class: {
          teacherId: 'teacher-1',
          enrollments: [
            {
              user: {
                id: 's-1',
                fullName: 'Alice',
                email: 'alice@test.com',
                avatarUrl: null,
              },
            },
            {
              user: {
                id: 's-2',
                fullName: 'Bob',
                email: 'bob@test.com',
                avatarUrl: null,
              },
            },
          ],
        },
        attempts: [
          {
            id: 'att-1',
            studentId: 's-1',
            score: 8.5,
            startedAt: new Date(),
            submittedAt: new Date(),
          },
        ],
      });

      const result = await service.getClassPublicationStats(
        'teacher-1',
        'pub-1',
      );

      expect(result.totalStudents).toBe(2);
      expect(result.submittedCount).toBe(1);
      expect(result.notSubmittedCount).toBe(1);
      expect(result.averageScore).toBe(8.5);
      expect(result.distribution.from8To10).toBe(1);
      expect(result.students[0].isSubmitted).toBe(true);
      expect(result.students[1].isSubmitted).toBe(false);
    });
  });
});
