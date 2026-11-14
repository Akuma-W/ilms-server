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
    quizAttempt: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    quizPublication: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

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

  describe('getAttemptResult', () => {
    it('should throw NotFoundException if attempt does not exist', async () => {
      mockPrisma.quizAttempt.findUnique.mockResolvedValue(null);

      await expect(
        service.getAttemptResult('student-1', 'att-none'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not author or teacher', async () => {
      mockPrisma.quizAttempt.findUnique.mockResolvedValue({
        id: 'att-1',
        studentId: 'student-2',
        quiz: { createdBy: 'teacher-2' },
        publication: { class: { teacherId: 'teacher-3' } },
      });

      await expect(
        service.getAttemptResult('student-1', 'att-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if attempt is not yet submitted', async () => {
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
          reviewMode: 'after_submission',
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
      expect(result.canViewAnswers).toBe(true);
    });

    it('should mask answers when reviewMode is never', async () => {
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
          reviewMode: 'never',
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
        publication: {
          reviewMode: 'never',
          class: { teacherId: 'teacher-1' },
        },
        quizAnswers: [{ questionId: 'q-1', selectedOption: 'opt-1' }],
      });

      const result = await service.getAttemptResult('student-1', 'att-1');

      expect(result.canViewAnswers).toBe(false);
      expect(result.details[0].correctOptionIds).toEqual([]);
      expect(result.details[0].explanation).toBeNull();
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
