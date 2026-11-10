import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { FileType } from 'src/generated/prisma/enums';

describe('AssignmentsService', () => {
  let service: AssignmentsService;

  const prismaMock = {
    class: {
      findUnique: jest.fn(),
    },
    topic: {
      findUnique: jest.fn(),
    },
    enrollment: {
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    assignment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    assignmentMaterials: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    submission: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    submissionFile: {
      deleteMany: jest.fn(),
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
        AssignmentsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<AssignmentsService>(AssignmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw NotFoundException if class does not exist', async () => {
      prismaMock.class.findUnique.mockResolvedValue(null);

      await expect(
        service.create('user-1', 'class-1', { title: 'Assignment 1' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not teacher', async () => {
      prismaMock.class.findUnique.mockResolvedValue({
        id: 'class-1',
        teacherId: 'teacher-owner',
      });
      prismaMock.enrollment.findFirst.mockResolvedValue(null);

      await expect(
        service.create('user-1', 'class-1', { title: 'Assignment 1' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if topic belongs to another class', async () => {
      prismaMock.class.findUnique.mockResolvedValue({
        id: 'class-1',
        teacherId: 'teacher-1',
      });
      prismaMock.topic.findUnique.mockResolvedValue({
        id: 'topic-1',
        classId: 'other-class',
      });

      await expect(
        service.create('teacher-1', 'class-1', {
          title: 'Assignment 1',
          topicId: 'topic-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully create assignment with materials', async () => {
      prismaMock.class.findUnique.mockResolvedValue({
        id: 'class-1',
        teacherId: 'teacher-1',
      });
      prismaMock.topic.findUnique.mockResolvedValue({
        id: 'topic-1',
        classId: 'class-1',
      });
      prismaMock.assignment.create.mockResolvedValue({
        id: 'assign-1',
        title: 'Assignment 1',
        materials: [
          { id: 'mat-1', fileUrl: 'file.pdf', fileType: FileType.pdf },
        ],
      });

      const result = await service.create('teacher-1', 'class-1', {
        title: 'Assignment 1',
        topicId: 'topic-1',
        materials: [{ fileUrl: 'file.pdf', fileType: FileType.pdf }],
      });

      expect(result.message).toBe('Create assignment successful');
      expect(result.data.id).toBe('assign-1');
    });
  });

  describe('findAllByClass', () => {
    it('should throw NotFoundException if class does not exist', async () => {
      prismaMock.class.findUnique.mockResolvedValue(null);

      await expect(service.findAllByClass('user-1', 'class-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return assignments with all submissions for teacher', async () => {
      prismaMock.class.findUnique.mockResolvedValue({
        id: 'class-1',
        teacherId: 'teacher-1',
      });
      prismaMock.enrollment.count.mockResolvedValue(20);
      prismaMock.assignment.findMany.mockResolvedValue([
        {
          id: 'assign-1',
          submissions: [{ id: 'sub-1', studentId: 'student-1' }],
        },
      ]);

      const result = await service.findAllByClass('teacher-1', 'class-1');
      expect(result).toHaveLength(1);
      expect(result[0].submissions).toHaveLength(1);
      expect(result[0].submissionCount).toBe(1);
      expect(result[0].totalStudents).toBe(20);
    });

    it('should filter submissions to student own submission for student', async () => {
      prismaMock.class.findUnique.mockResolvedValue({
        id: 'class-1',
        teacherId: 'teacher-owner',
      });
      prismaMock.enrollment.findFirst.mockResolvedValue(null);
      prismaMock.enrollment.count.mockResolvedValue(15);
      prismaMock.assignment.findMany.mockResolvedValue([
        {
          id: 'assign-1',
          submissions: [
            { id: 'sub-1', studentId: 'student-1' },
            { id: 'sub-2', studentId: 'student-2' },
          ],
        },
      ]);

      const result = await service.findAllByClass('student-1', 'class-1');
      expect(result[0].submissions).toHaveLength(1);
      expect(result[0].submissions[0].studentId).toBe('student-1');
      expect(result[0].submissionCount).toBe(2);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if assignment does not exist', async () => {
      prismaMock.assignment.findUnique.mockResolvedValue(null);

      await expect(service.findOne('user-1', 'assign-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return assignment details with metrics', async () => {
      prismaMock.assignment.findUnique.mockResolvedValue({
        id: 'assign-1',
        classId: 'class-1',
        class: { id: 'class-1', teacherId: 'teacher-1' },
        submissions: [{ id: 'sub-1', studentId: 'student-1' }],
      });
      prismaMock.enrollment.count.mockResolvedValue(10);

      const result = await service.findOne('teacher-1', 'assign-1');
      expect(result.id).toBe('assign-1');
      expect(result.totalStudents).toBe(10);
      expect(result.submissionCount).toBe(1);
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if assignment does not exist', async () => {
      prismaMock.assignment.findUnique.mockResolvedValue(null);

      await expect(
        service.update('user-1', 'assign-1', { title: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not teacher', async () => {
      prismaMock.assignment.findUnique.mockResolvedValue({
        id: 'assign-1',
        classId: 'class-1',
      });
      prismaMock.class.findUnique.mockResolvedValue({
        id: 'class-1',
        teacherId: 'other-teacher',
      });
      prismaMock.enrollment.findFirst.mockResolvedValue(null);

      await expect(
        service.update('user-1', 'assign-1', { title: 'New' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should successfully update assignment and replace materials', async () => {
      prismaMock.assignment.findUnique.mockResolvedValue({
        id: 'assign-1',
        classId: 'class-1',
      });
      prismaMock.class.findUnique.mockResolvedValue({
        id: 'class-1',
        teacherId: 'teacher-1',
      });
      prismaMock.assignment.update.mockResolvedValue({
        id: 'assign-1',
        title: 'Updated Title',
        materials: [{ id: 'mat-new', fileUrl: 'new.pdf' }],
      });

      const result = await service.update('teacher-1', 'assign-1', {
        title: 'Updated Title',
        materials: [{ fileUrl: 'new.pdf', fileType: FileType.pdf }],
      });

      expect(result.message).toBe('Update assignment successful');
      expect(result.data.title).toBe('Updated Title');
      expect(prismaMock.assignmentMaterials.deleteMany).toHaveBeenCalledWith({
        where: { assignmentId: 'assign-1' },
      });
      expect(prismaMock.assignmentMaterials.createMany).toHaveBeenCalledWith({
        data: [
          {
            assignmentId: 'assign-1',
            fileUrl: 'new.pdf',
            fileType: FileType.pdf,
          },
        ],
      });
    });
  });

  describe('delete', () => {
    it('should throw NotFoundException if assignment does not exist', async () => {
      prismaMock.assignment.findUnique.mockResolvedValue(null);

      await expect(service.delete('user-1', 'assign-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should delete assignment along with submissions and materials', async () => {
      prismaMock.assignment.findUnique.mockResolvedValue({
        id: 'assign-1',
        classId: 'class-1',
      });
      prismaMock.class.findUnique.mockResolvedValue({
        id: 'class-1',
        teacherId: 'teacher-1',
      });
      prismaMock.submission.findMany.mockResolvedValue([{ id: 'sub-1' }]);

      const result = await service.delete('teacher-1', 'assign-1');
      expect(result.message).toBe('Delete assignment successful');
      expect(prismaMock.submissionFile.deleteMany).toHaveBeenCalledWith({
        where: { submissionId: { in: ['sub-1'] } },
      });
      expect(prismaMock.submission.deleteMany).toHaveBeenCalledWith({
        where: { assignmentId: 'assign-1' },
      });
      expect(prismaMock.assignmentMaterials.deleteMany).toHaveBeenCalledWith({
        where: { assignmentId: 'assign-1' },
      });
      expect(prismaMock.assignment.delete).toHaveBeenCalledWith({
        where: { id: 'assign-1' },
      });
    });
  });
});
