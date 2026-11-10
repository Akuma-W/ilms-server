import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { FileType } from 'src/generated/prisma/enums';

describe('SubmissionsService', () => {
  let service: SubmissionsService;

  const prismaMock = {
    class: {
      findUnique: jest.fn(),
    },
    enrollment: {
      findFirst: jest.fn(),
    },
    assignment: {
      findUnique: jest.fn(),
    },
    submission: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    submissionFile: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prismaMock.$transaction.mockImplementation(
      (cb: (tx: typeof prismaMock) => Promise<unknown>) => cb(prismaMock),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<SubmissionsService>(SubmissionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submit', () => {
    it('should throw NotFoundException if assignment does not exist', async () => {
      prismaMock.assignment.findUnique.mockResolvedValue(null);

      await expect(
        service.submit('student-1', 'assign-1', { textAnswer: 'Answer' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create new submission when no previous submission exists', async () => {
      prismaMock.assignment.findUnique.mockResolvedValue({
        id: 'assign-1',
        dueAt: new Date(Date.now() + 100000),
      });
      prismaMock.submission.findUnique.mockResolvedValue(null);
      prismaMock.submission.create.mockResolvedValue({
        id: 'sub-1',
        textAnswer: 'Answer',
        isLate: false,
      });

      const result = await service.submit('student-1', 'assign-1', {
        textAnswer: 'Answer',
      });
      expect(result.message).toBe('Submit assignment successful');
      expect(result.data.id).toBe('sub-1');
      expect(prismaMock.submission.create).toHaveBeenCalled();
    });

    it('should update existing submission if already submitted', async () => {
      prismaMock.assignment.findUnique.mockResolvedValue({
        id: 'assign-1',
        dueAt: new Date(Date.now() + 100000),
      });
      prismaMock.submission.findUnique.mockResolvedValue({
        id: 'sub-1',
        textAnswer: 'Old answer',
      });
      prismaMock.submission.update.mockResolvedValue({
        id: 'sub-1',
        textAnswer: 'New answer',
        isLate: false,
      });

      const result = await service.submit('student-1', 'assign-1', {
        textAnswer: 'New answer',
        files: [{ fileUrl: 'new.pdf', fileType: FileType.pdf }],
      });
      expect(result.message).toBe('Submit assignment successful');
      expect(prismaMock.submissionFile.deleteMany).toHaveBeenCalledWith({
        where: { submissionId: 'sub-1' },
      });
      expect(prismaMock.submissionFile.createMany).toHaveBeenCalledWith({
        data: [
          { submissionId: 'sub-1', fileUrl: 'new.pdf', fileType: FileType.pdf },
        ],
      });
      expect(prismaMock.submission.update).toHaveBeenCalled();
    });

    it('should mark isLate as true when submitting past deadline', async () => {
      prismaMock.assignment.findUnique.mockResolvedValue({
        id: 'assign-1',
        dueAt: new Date(Date.now() - 100000),
      });
      prismaMock.submission.findUnique.mockResolvedValue(null);
      prismaMock.submission.create.mockResolvedValue({
        id: 'sub-1',
        isLate: true,
      });

      const result = await service.submit('student-1', 'assign-1', {
        textAnswer: 'Late answer',
      });
      expect(result.data.isLate).toBe(true);
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if submission does not exist', async () => {
      prismaMock.submission.findUnique.mockResolvedValue(null);

      await expect(
        service.update('student-1', 'sub-1', { textAnswer: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not author of submission', async () => {
      prismaMock.submission.findUnique.mockResolvedValue({
        id: 'sub-1',
        studentId: 'other-student',
        assignment: {},
      });

      await expect(
        service.update('student-1', 'sub-1', { textAnswer: 'Updated' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should successfully update submission files and answer', async () => {
      prismaMock.submission.findUnique.mockResolvedValue({
        id: 'sub-1',
        studentId: 'student-1',
        assignment: { dueAt: new Date(Date.now() + 100000) },
      });
      prismaMock.submission.update.mockResolvedValue({
        id: 'sub-1',
        textAnswer: 'Updated text',
      });

      const result = await service.update('student-1', 'sub-1', {
        textAnswer: 'Updated text',
        files: [{ fileUrl: 'update.pdf', fileType: FileType.pdf }],
      });
      expect(result.message).toBe('Update submission successful');
      expect(prismaMock.submissionFile.deleteMany).toHaveBeenCalledWith({
        where: { submissionId: 'sub-1' },
      });
      expect(prismaMock.submissionFile.createMany).toHaveBeenCalledWith({
        data: [
          {
            submissionId: 'sub-1',
            fileUrl: 'update.pdf',
            fileType: FileType.pdf,
          },
        ],
      });
    });
  });

  describe('grade', () => {
    it('should throw NotFoundException if submission does not exist', async () => {
      prismaMock.submission.findUnique.mockResolvedValue(null);

      await expect(
        service.grade('teacher-1', 'sub-1', { score: 9 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not teacher of class', async () => {
      prismaMock.submission.findUnique.mockResolvedValue({
        id: 'sub-1',
        assignment: { classId: 'class-1', maxScore: 10 },
      });
      prismaMock.class.findUnique.mockResolvedValue({
        id: 'class-1',
        teacherId: 'owner-teacher',
      });
      prismaMock.enrollment.findFirst.mockResolvedValue(null);

      await expect(
        service.grade('other-user', 'sub-1', { score: 9 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if score exceeds assignment maxScore', async () => {
      prismaMock.submission.findUnique.mockResolvedValue({
        id: 'sub-1',
        assignment: { classId: 'class-1', maxScore: 10 },
      });
      prismaMock.class.findUnique.mockResolvedValue({
        id: 'class-1',
        teacherId: 'teacher-1',
      });

      await expect(
        service.grade('teacher-1', 'sub-1', { score: 15 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully grade submission', async () => {
      prismaMock.submission.findUnique.mockResolvedValue({
        id: 'sub-1',
        assignment: { classId: 'class-1', maxScore: 10 },
      });
      prismaMock.class.findUnique.mockResolvedValue({
        id: 'class-1',
        teacherId: 'teacher-1',
      });
      prismaMock.submission.update.mockResolvedValue({
        id: 'sub-1',
        score: 9.5,
        feedback: 'Excellent work',
      });

      const result = await service.grade('teacher-1', 'sub-1', {
        score: 9.5,
        feedback: 'Excellent work',
      });
      expect(result.message).toBe('Grade submission successful');
      expect(result.data.score).toBe(9.5);
    });
  });

  describe('delete', () => {
    it('should throw NotFoundException if submission does not exist', async () => {
      prismaMock.submission.findUnique.mockResolvedValue(null);

      await expect(service.delete('student-1', 'sub-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not author of submission', async () => {
      prismaMock.submission.findUnique.mockResolvedValue({
        id: 'sub-1',
        studentId: 'other-student',
      });

      await expect(service.delete('student-1', 'sub-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if submission is already graded', async () => {
      prismaMock.submission.findUnique.mockResolvedValue({
        id: 'sub-1',
        studentId: 'student-1',
        score: 8.5,
      });

      await expect(service.delete('student-1', 'sub-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should successfully cancel submission and delete files', async () => {
      prismaMock.submission.findUnique.mockResolvedValue({
        id: 'sub-1',
        studentId: 'student-1',
        score: null,
      });

      const result = await service.delete('student-1', 'sub-1');
      expect(result.message).toBe('Cancel submission successful');
      expect(prismaMock.submissionFile.deleteMany).toHaveBeenCalledWith({
        where: { submissionId: 'sub-1' },
      });
      expect(prismaMock.submission.delete).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
      });
    });
  });
});
