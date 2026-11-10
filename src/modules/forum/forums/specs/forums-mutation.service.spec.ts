import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ForumsService } from '../forums.service';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { EnrollmentStatus, Role } from 'src/generated/prisma/enums';

describe('ForumsService - Mutation', () => {
  let service: ForumsService;

  const prismaMock = {
    class: {
      findFirst: jest.fn(),
    },
    enrollment: {
      findFirst: jest.fn(),
    },
    forum: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ForumsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<ForumsService>(ForumsService);
  });

  describe('create', () => {
    it('should throw BadRequestException if teacher attempts to post anonymously', async () => {
      prismaMock.class.findFirst.mockResolvedValue({
        id: 'class-1',
        teacherId: 'teacher-1',
      });

      await expect(
        service.create(
          'class-1',
          { title: 'Title', content: 'Content', isAnonymous: true },
          'teacher-1',
          Role.teacher,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create forum successfully for student', async () => {
      prismaMock.class.findFirst.mockResolvedValue({
        id: 'class-1',
        teacherId: 'teacher-1',
      });
      prismaMock.enrollment.findFirst.mockResolvedValue({
        status: EnrollmentStatus.approved,
      });
      prismaMock.forum.create.mockResolvedValue({
        id: 'forum-1',
        title: 'New Topic',
        content: 'New Content',
        isAnonymous: true,
        isDeleted: false,
        createdAt: new Date(),
        classId: 'class-1',
        createdBy: 'student-1',
        author: {
          id: 'student-1',
          fullName: 'Student A',
          avatarUrl: null,
          role: Role.student,
        },
      });

      const result = await service.create(
        'class-1',
        { title: 'New Topic', content: 'New Content', isAnonymous: true },
        'student-1',
        Role.student,
      );

      expect(result.title).toBe('New Topic');
      expect(result.commentCount).toBe(0);
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if forum does not exist', async () => {
      prismaMock.forum.findFirst.mockResolvedValue(null);

      await expect(
        service.update('forum-1', { title: 'Updated' }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the author', async () => {
      prismaMock.forum.findFirst.mockResolvedValue({
        id: 'forum-1',
        createdBy: 'user-author',
        isDeleted: false,
      });

      await expect(
        service.update('forum-1', { title: 'Updated' }, 'user-other'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should update forum successfully when user is the author', async () => {
      prismaMock.forum.findFirst.mockResolvedValue({
        id: 'forum-1',
        createdBy: 'user-1',
        isDeleted: false,
      });
      prismaMock.forum.update.mockResolvedValue({
        id: 'forum-1',
        title: 'Updated Title',
        content: 'Updated Content',
        isAnonymous: false,
        isDeleted: false,
        createdAt: new Date(),
        classId: 'class-1',
        createdBy: 'user-1',
        author: {
          id: 'user-1',
          fullName: 'User 1',
          avatarUrl: null,
          role: Role.student,
        },
        _count: { comments: 2 },
      });

      const result = await service.update(
        'forum-1',
        { title: 'Updated Title' },
        'user-1',
      );

      expect(result.title).toBe('Updated Title');
      expect(result.commentCount).toBe(2);
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if forum does not exist', async () => {
      prismaMock.forum.findFirst.mockResolvedValue(null);

      await expect(
        service.remove('forum-1', 'user-1', Role.student),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not author or teacher or admin', async () => {
      prismaMock.forum.findFirst.mockResolvedValue({
        id: 'forum-1',
        createdBy: 'user-author',
        isDeleted: false,
        class: { teacherId: 'teacher-1' },
      });

      await expect(
        service.remove('forum-1', 'user-intruder', Role.student),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow author or teacher to soft delete forum', async () => {
      prismaMock.forum.findFirst.mockResolvedValue({
        id: 'forum-1',
        createdBy: 'user-author',
        isDeleted: false,
        class: { teacherId: 'teacher-1' },
      });
      prismaMock.forum.update.mockResolvedValue({
        id: 'forum-1',
        isDeleted: true,
      });

      await service.remove('forum-1', 'teacher-1', Role.teacher);

      expect(prismaMock.forum.update).toHaveBeenCalledWith({
        where: { id: 'forum-1' },
        data: { isDeleted: true },
      });
    });
  });
});
