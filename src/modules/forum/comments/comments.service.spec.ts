import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { EnrollmentStatus, Role } from 'src/generated/prisma/enums';

describe('CommentsService', () => {
  let service: CommentsService;

  const prismaMock = {
    forum: {
      findFirst: jest.fn(),
    },
    enrollment: {
      findFirst: jest.fn(),
    },
    comment: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw NotFoundException if forum does not exist', async () => {
      prismaMock.forum.findFirst.mockResolvedValue(null);

      await expect(
        service.create(
          'forum-1',
          { content: 'Nice topic' },
          'user-1',
          Role.student,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not enrolled in class', async () => {
      prismaMock.forum.findFirst.mockResolvedValue({
        id: 'forum-1',
        classId: 'class-1',
        isDeleted: false,
        class: { id: 'class-1', teacherId: 'teacher-1' },
      });
      prismaMock.enrollment.findFirst.mockResolvedValue(null);

      await expect(
        service.create(
          'forum-1',
          { content: 'Nice topic' },
          'user-1',
          Role.student,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if parent comment does not exist or deleted', async () => {
      prismaMock.forum.findFirst.mockResolvedValue({
        id: 'forum-1',
        classId: 'class-1',
        isDeleted: false,
        class: { id: 'class-1', teacherId: 'teacher-1' },
      });
      prismaMock.enrollment.findFirst.mockResolvedValue({
        status: EnrollmentStatus.approved,
      });
      prismaMock.comment.findFirst.mockResolvedValue(null);

      await expect(
        service.create(
          'forum-1',
          { content: 'Reply content', parentId: 'parent-missing' },
          'user-1',
          Role.student,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if parent comment belongs to another forum', async () => {
      prismaMock.forum.findFirst.mockResolvedValue({
        id: 'forum-1',
        classId: 'class-1',
        isDeleted: false,
        class: { id: 'class-1', teacherId: 'teacher-1' },
      });
      prismaMock.enrollment.findFirst.mockResolvedValue({
        status: EnrollmentStatus.approved,
      });
      prismaMock.comment.findFirst.mockResolvedValue({
        id: 'parent-1',
        forumId: 'other-forum',
        isDeleted: false,
      });

      await expect(
        service.create(
          'forum-1',
          { content: 'Reply content', parentId: 'parent-1' },
          'user-1',
          Role.student,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create root comment successfully', async () => {
      prismaMock.forum.findFirst.mockResolvedValue({
        id: 'forum-1',
        classId: 'class-1',
        isDeleted: false,
        class: { id: 'class-1', teacherId: 'teacher-1' },
      });
      prismaMock.enrollment.findFirst.mockResolvedValue({
        status: EnrollmentStatus.approved,
      });
      prismaMock.comment.create.mockResolvedValue({
        id: 'comment-1',
        content: 'Great discussion',
        parentId: null,
        isAnonymous: false,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        forumId: 'forum-1',
        authorId: 'user-1',
        author: {
          id: 'user-1',
          fullName: 'Nguyen Van A',
          avatarUrl: null,
          role: Role.student,
        },
      });

      const result = await service.create(
        'forum-1',
        { content: 'Great discussion' },
        'user-1',
        Role.student,
      );

      expect(result.id).toBe('comment-1');
      expect(result.content).toBe('Great discussion');
      expect(result.parentId).toBeNull();
    });

    it('should create nested reply successfully', async () => {
      prismaMock.forum.findFirst.mockResolvedValue({
        id: 'forum-1',
        classId: 'class-1',
        isDeleted: false,
        class: { id: 'class-1', teacherId: 'teacher-1' },
      });
      prismaMock.enrollment.findFirst.mockResolvedValue({
        status: EnrollmentStatus.approved,
      });
      prismaMock.comment.findFirst.mockResolvedValue({
        id: 'parent-1',
        forumId: 'forum-1',
        isDeleted: false,
      });
      prismaMock.comment.create.mockResolvedValue({
        id: 'comment-2',
        content: 'Reply to parent',
        parentId: 'parent-1',
        isAnonymous: false,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        forumId: 'forum-1',
        authorId: 'user-1',
        author: {
          id: 'user-1',
          fullName: 'Nguyen Van A',
          avatarUrl: null,
          role: Role.student,
        },
      });

      const result = await service.create(
        'forum-1',
        { content: 'Reply to parent', parentId: 'parent-1' },
        'user-1',
        Role.student,
      );

      expect(result.parentId).toBe('parent-1');
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if comment does not exist', async () => {
      prismaMock.comment.findFirst.mockResolvedValue(null);

      await expect(
        service.update(
          'forum-1',
          'comment-1',
          { content: 'New content' },
          'user-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if comment does not belong to specified forum', async () => {
      prismaMock.comment.findFirst.mockResolvedValue({
        id: 'comment-1',
        forumId: 'other-forum',
        isDeleted: false,
      });

      await expect(
        service.update(
          'forum-1',
          'comment-1',
          { content: 'New content' },
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if user is not author of comment', async () => {
      prismaMock.comment.findFirst.mockResolvedValue({
        id: 'comment-1',
        forumId: 'forum-1',
        authorId: 'user-author',
        isDeleted: false,
      });

      await expect(
        service.update(
          'forum-1',
          'comment-1',
          { content: 'New content' },
          'user-other',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should update comment content successfully', async () => {
      prismaMock.comment.findFirst.mockResolvedValue({
        id: 'comment-1',
        forumId: 'forum-1',
        authorId: 'user-1',
        isDeleted: false,
      });
      prismaMock.comment.update.mockResolvedValue({
        id: 'comment-1',
        content: 'Updated content',
        isAnonymous: false,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        forumId: 'forum-1',
        authorId: 'user-1',
        parentId: null,
        author: {
          id: 'user-1',
          fullName: 'User 1',
          avatarUrl: null,
          role: Role.student,
        },
      });

      const result = await service.update(
        'forum-1',
        'comment-1',
        { content: 'Updated content' },
        'user-1',
      );

      expect(result.content).toBe('Updated content');
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if comment does not exist', async () => {
      prismaMock.comment.findFirst.mockResolvedValue(null);

      await expect(
        service.remove('forum-1', 'comment-1', 'user-1', Role.student),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if comment does not belong to specified forum', async () => {
      prismaMock.comment.findFirst.mockResolvedValue({
        id: 'comment-1',
        forumId: 'other-forum',
        isDeleted: false,
      });

      await expect(
        service.remove('forum-1', 'comment-1', 'user-1', Role.student),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if user is not author, teacher or admin', async () => {
      prismaMock.comment.findFirst.mockResolvedValue({
        id: 'comment-1',
        forumId: 'forum-1',
        authorId: 'user-author',
        isDeleted: false,
        forum: {
          class: { teacherId: 'teacher-1' },
        },
      });

      await expect(
        service.remove('forum-1', 'comment-1', 'user-other', Role.student),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow author or teacher to soft delete comment', async () => {
      prismaMock.comment.findFirst.mockResolvedValue({
        id: 'comment-1',
        forumId: 'forum-1',
        authorId: 'user-author',
        isDeleted: false,
        forum: {
          class: { teacherId: 'teacher-1' },
        },
      });
      prismaMock.comment.update.mockResolvedValue({
        id: 'comment-1',
        isDeleted: true,
      });

      await service.remove('forum-1', 'comment-1', 'teacher-1', Role.teacher);

      expect(prismaMock.comment.update).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
        data: { isDeleted: true },
      });
    });
  });
});
