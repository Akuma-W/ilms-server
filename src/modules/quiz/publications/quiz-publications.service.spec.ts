import { ConflictException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { QuizPublicationsService } from './quiz-publications.service';

describe('QuizPublicationsService', () => {
  let service: QuizPublicationsService;

  const mockPrisma = {
    class: {
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    enrollment: {
      count: jest.fn(),
    },
    quiz: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    quizAttempt: {
      findMany: jest.fn(),
    },
    quizPublication: {
      create: jest.fn(),
      upsert: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizPublicationsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<QuizPublicationsService>(QuizPublicationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('publishToClass', () => {
    it('should throw ForbiddenException if user is not the teacher of class', async () => {
      mockPrisma.class.findUnique.mockResolvedValue({
        id: 'class-1',
        teacherId: 'teacher-2',
      });

      await expect(
        service.publishToClass('teacher-1', 'quiz-1', { classId: 'class-1' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if quiz is already published in class', async () => {
      mockPrisma.class.findUnique.mockResolvedValue({
        id: 'class-1',
        teacherId: 'teacher-1',
      });
      mockPrisma.quiz.findUnique.mockResolvedValue({
        id: 'quiz-1',
        visibility: 'public',
        createdBy: 'teacher-1',
      });
      mockPrisma.quizPublication.findUnique.mockResolvedValue({
        id: 'existing-pub',
      });

      await expect(
        service.publishToClass('teacher-1', 'quiz-1', { classId: 'class-1' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create publication when teacher has permission', async () => {
      mockPrisma.class.findUnique.mockResolvedValue({
        id: 'class-1',
        teacherId: 'teacher-1',
      });
      mockPrisma.quiz.findUnique.mockResolvedValue({
        id: 'quiz-1',
        visibility: 'public',
        createdBy: 'teacher-1',
      });
      mockPrisma.quizPublication.findUnique.mockResolvedValue(null);
      mockPrisma.quizPublication.create.mockResolvedValue({ id: 'pub-1' });

      const result = await service.publishToClass('teacher-1', 'quiz-1', {
        classId: 'class-1',
      });

      expect(mockPrisma.quizPublication.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('getClassPublications', () => {
    it('should throw ForbiddenException if user is neither teacher nor student', async () => {
      mockPrisma.class.count.mockResolvedValue(0);
      mockPrisma.enrollment.count.mockResolvedValue(0);

      await expect(
        service.getClassPublications('user-3', 'class-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return list of publications with latest attempt for member', async () => {
      mockPrisma.class.count.mockResolvedValue(0);
      mockPrisma.enrollment.count
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(32);
      mockPrisma.quizPublication.findMany.mockResolvedValue([
        {
          id: 'pub-1',
          quizId: 'quiz-1',
          classId: 'class-1',
          topicId: null,
          topic: null,
          openAt: null,
          closeAt: null,
          isPublic: false,
          reviewMode: 'after_submission',
          publishedAt: new Date(),
          quiz: {
            id: 'quiz-1',
            title: 'Q1',
            timeLimit: 30,
            _count: { questions: 5 },
          },
          _count: { attempts: 10 },
          attempts: [{ id: 'att-1', score: 9.0 }],
        },
      ]);
      mockPrisma.quizAttempt.findMany.mockResolvedValue([
        { publicationId: 'pub-1', studentId: 'student-1' },
        { publicationId: 'pub-1', studentId: 'student-2' },
      ]);

      const result = await service.getClassPublications('student-1', 'class-1');

      expect(result).toHaveLength(1);
      expect(result[0].latestUserAttempt).toBeDefined();
      expect(result[0].totalAttemptsCount).toBe(10);
      expect(result[0].submittedCount).toBe(2);
      expect(result[0].totalStudents).toBe(32);
    });
  });

  describe('updatePublication', () => {
    it('should throw ForbiddenException if user is not teacher of class', async () => {
      mockPrisma.quizPublication.findUnique.mockResolvedValue({
        id: 'pub-1',
        class: { teacherId: 'teacher-2' },
      });

      await expect(
        service.updatePublication('teacher-1', 'pub-1', { isPublic: true }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should update publication when user is teacher', async () => {
      mockPrisma.quizPublication.findUnique.mockResolvedValue({
        id: 'pub-1',
        class: { teacherId: 'teacher-1' },
      });
      mockPrisma.quizPublication.update.mockResolvedValue({
        id: 'pub-1',
        isPublic: true,
      });

      const result = await service.updatePublication('teacher-1', 'pub-1', {
        isPublic: true,
      });

      expect(mockPrisma.quizPublication.update).toHaveBeenCalled();
      expect(result.isPublic).toBe(true);
    });
  });

  describe('deletePublication', () => {
    it('should delete publication when user is teacher', async () => {
      mockPrisma.quizPublication.findUnique.mockResolvedValue({
        id: 'pub-1',
        quizId: 'quiz-1',
        class: { teacherId: 'teacher-1' },
      });
      mockPrisma.quizPublication.delete.mockResolvedValue({
        id: 'pub-1',
        quizId: 'quiz-1',
      });
      mockPrisma.quizPublication.count.mockResolvedValue(0);
      mockPrisma.quiz.findUnique.mockResolvedValue({
        id: 'quiz-1',
        visibility: 'private',
      });
      mockPrisma.quiz.update.mockResolvedValue({
        id: 'quiz-1',
        status: 'draft',
      });

      await service.deletePublication('teacher-1', 'pub-1');

      expect(mockPrisma.quizPublication.delete).toHaveBeenCalledWith({
        where: { id: 'pub-1' },
      });
    });
  });
});
