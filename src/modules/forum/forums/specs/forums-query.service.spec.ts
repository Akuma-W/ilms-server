import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ForumsService } from '../forums.service';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { EnrollmentStatus, Role } from 'src/generated/prisma/enums';
import { ForumTabFilter } from '../dto/query-forum.dto';
import { CommentEntity } from '../../comments/entities/comment.entity';

describe('ForumsService - Query', () => {
  let service: ForumsService;

  const prismaMock = {
    class: {
      findFirst: jest.fn(),
    },
    enrollment: {
      findFirst: jest.fn(),
    },
    forum: {
      findMany: jest.fn(),
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

  describe('findAll', () => {
    it('should throw NotFoundException if class does not exist', async () => {
      prismaMock.class.findFirst.mockResolvedValue(null);

      await expect(
        service.findAll('class-1', {}, 'user-1', Role.student),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not enrolled in class', async () => {
      prismaMock.class.findFirst.mockResolvedValue({
        id: 'class-1',
        teacherId: 'teacher-1',
      });
      prismaMock.enrollment.findFirst.mockResolvedValue(null);

      await expect(
        service.findAll('class-1', {}, 'user-1', Role.student),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return forums with masked author for anonymous posts when viewed by another student', async () => {
      prismaMock.class.findFirst.mockResolvedValue({
        id: 'class-1',
        teacherId: 'teacher-1',
      });
      prismaMock.enrollment.findFirst.mockResolvedValue({
        status: EnrollmentStatus.approved,
      });
      prismaMock.forum.findMany.mockResolvedValue([
        {
          id: 'forum-1',
          title: 'Topic 1',
          content: 'Content 1',
          isAnonymous: true,
          isDeleted: false,
          createdAt: new Date(),
          classId: 'class-1',
          createdBy: 'user-2',
          author: {
            id: 'user-2',
            fullName: 'Tran Thi B',
            avatarUrl: 'b.png',
            role: Role.student,
          },
          _count: { comments: 3 },
        },
      ]);

      const result = await service.findAll(
        'class-1',
        {},
        'user-1',
        Role.student,
      );

      expect(result).toHaveLength(1);
      expect(result[0].author?.fullName).toBe('Anonymous Student');
      expect(result[0].author?.avatar).toBeNull();
      expect(result[0].commentCount).toBe(3);
    });

    it('should show real author profile when viewed by the author or teacher', async () => {
      prismaMock.class.findFirst.mockResolvedValue({
        id: 'class-1',
        teacherId: 'teacher-1',
      });
      prismaMock.forum.findMany.mockResolvedValue([
        {
          id: 'forum-1',
          title: 'Topic 1',
          content: 'Content 1',
          isAnonymous: true,
          isDeleted: false,
          createdAt: new Date(),
          classId: 'class-1',
          createdBy: 'user-2',
          author: {
            id: 'user-2',
            fullName: 'Tran Thi B',
            avatarUrl: 'b.png',
            role: Role.student,
          },
          _count: { comments: 0 },
        },
      ]);

      const result = await service.findAll(
        'class-1',
        {},
        'teacher-1',
        Role.teacher,
      );

      expect(result[0].author?.fullName).toBe('Tran Thi B');
    });

    it('should filter by my_posts and unanswered tabs', async () => {
      prismaMock.class.findFirst.mockResolvedValue({
        id: 'class-1',
        teacherId: 'teacher-1',
      });
      prismaMock.forum.findMany.mockResolvedValue([]);

      await service.findAll(
        'class-1',
        { tab: ForumTabFilter.MY_POSTS, search: 'algo' },
        'teacher-1',
        Role.teacher,
      );

      expect(prismaMock.forum.findMany).toHaveBeenCalled();
      const calls = prismaMock.forum.findMany.mock.calls as Array<
        [{ where?: { createdBy?: string } }]
      >;
      expect(calls[0]?.[0]?.where?.createdBy).toBe('teacher-1');
    });

    it('should apply pagination parameters (skip, take) when provided', async () => {
      prismaMock.class.findFirst.mockResolvedValue({
        id: 'class-1',
        teacherId: 'teacher-1',
      });
      prismaMock.forum.findMany.mockResolvedValue([]);

      await service.findAll(
        'class-1',
        { page: 2, limit: 10 },
        'teacher-1',
        Role.teacher,
      );

      expect(prismaMock.forum.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if forum does not exist', async () => {
      prismaMock.forum.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('forum-1', 'user-1', Role.student),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user cannot access classroom', async () => {
      prismaMock.forum.findFirst.mockResolvedValue({
        id: 'forum-1',
        classId: 'class-1',
        isDeleted: false,
        comments: [],
      });
      prismaMock.class.findFirst.mockResolvedValue({
        id: 'class-1',
        teacherId: 'teacher-1',
      });
      prismaMock.enrollment.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('forum-1', 'user-1', Role.student),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return forum details and mask soft-deleted comments having active replies', async () => {
      prismaMock.forum.findFirst.mockResolvedValue({
        id: 'forum-1',
        classId: 'class-1',
        title: 'Title',
        content: 'Content',
        isAnonymous: false,
        isDeleted: false,
        createdAt: new Date(),
        createdBy: 'user-1',
        author: {
          id: 'user-1',
          fullName: 'User 1',
          avatarUrl: null,
          role: Role.student,
        },
        comments: [
          {
            id: 'c-1',
            content: 'Original parent',
            isAnonymous: false,
            isDeleted: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            forumId: 'forum-1',
            authorId: 'user-2',
            parentId: null,
            author: {
              id: 'user-2',
              fullName: 'User 2',
              avatarUrl: null,
              role: Role.student,
            },
            replies: [
              {
                id: 'r-1',
                content: 'Active reply',
                isAnonymous: false,
                isDeleted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                forumId: 'forum-1',
                authorId: 'user-3',
                parentId: 'c-1',
                author: {
                  id: 'user-3',
                  fullName: 'User 3',
                  avatarUrl: null,
                  role: Role.student,
                },
              },
            ],
          },
        ],
      });
      prismaMock.class.findFirst.mockResolvedValue({
        id: 'class-1',
        teacherId: 'teacher-1',
      });
      prismaMock.enrollment.findFirst.mockResolvedValue({
        status: EnrollmentStatus.approved,
      });

      const result = await service.findOne('forum-1', 'user-1', Role.student);

      expect(result.comments).toBeDefined();
      const commentsList: CommentEntity[] = result.comments ?? [];
      expect(commentsList).toHaveLength(1);
      expect(commentsList[0].content).toBe('[This comment has been deleted]');
      expect(commentsList[0].replies).toHaveLength(1);
      expect(commentsList[0].replies?.[0].content).toBe('Active reply');
    });
  });
});
