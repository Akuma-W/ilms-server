import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { EnrollmentStatus, Role } from 'src/generated/prisma/enums';
import { CreateForumDto } from './dto/create-forum.dto';
import { UpdateForumDto } from './dto/update-forum.dto';
import { ForumTabFilter, QueryForumDto } from './dto/query-forum.dto';
import { ForumEntity } from './entities/forum.entity';
import { toForumEntity } from '../utils/forum-mapper.util';

@Injectable()
export class ForumsService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper method to verify classroom membership and teacher permissions
  private async checkClassAccess(
    classId: string,
    userId: string,
    userRole: Role,
  ) {
    const classroom = await this.prisma.class.findFirst({
      where: { id: classId },
      select: { id: true, teacherId: true },
    });

    if (!classroom) {
      throw new NotFoundException('Class not found');
    }

    if (userRole === Role.admin || classroom.teacherId === userId) {
      return { classroom, isTeacherOrAdmin: true };
    }

    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        classId,
        userId,
        status: EnrollmentStatus.approved,
      },
      select: { id: true },
    });

    if (!enrollment) {
      throw new ForbiddenException(
        'You do not have permission to access this classroom forum',
      );
    }

    return { classroom, isTeacherOrAdmin: false };
  }

  // Retrieve discussion topics in a classroom with optional pagination
  async findAll(
    classId: string,
    query: QueryForumDto,
    userId: string,
    userRole: Role,
  ): Promise<ForumEntity[]> {
    const { isTeacherOrAdmin } = await this.checkClassAccess(
      classId,
      userId,
      userRole,
    );

    const whereClause: Prisma.ForumWhereInput = {
      classId,
      isDeleted: false,
    };

    if (query.tab === ForumTabFilter.MY_POSTS) {
      whereClause.createdBy = userId;
    } else if (query.tab === ForumTabFilter.UNANSWERED) {
      whereClause.comments = {
        none: { isDeleted: false },
      };
    }

    if (query.search?.trim()) {
      const keyword = query.search.trim();
      whereClause.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { content: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const skip =
      query.page && query.limit ? (query.page - 1) * query.limit : undefined;
    const take = query.limit as number;

    const forums = await this.prisma.forum.findMany({
      where: whereClause,
      ...(skip !== undefined && { skip }),
      ...(take !== undefined && { take }),
      include: {
        author: {
          select: { id: true, fullName: true, avatarUrl: true, role: true },
        },
        _count: {
          select: {
            comments: {
              where: { isDeleted: false },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return forums.map((f) => toForumEntity(f, userId, isTeacherOrAdmin));
  }

  // Retrieve detailed discussion topic with nested comments
  async findOne(
    forumId: string,
    userId: string,
    userRole: Role,
  ): Promise<ForumEntity> {
    const forum = await this.prisma.forum.findFirst({
      where: { id: forumId, isDeleted: false },
      include: {
        author: {
          select: { id: true, fullName: true, avatarUrl: true, role: true },
        },
        comments: {
          include: {
            author: {
              select: { id: true, fullName: true, avatarUrl: true, role: true },
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    fullName: true,
                    avatarUrl: true,
                    role: true,
                  },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!forum) {
      throw new NotFoundException(
        'Discussion topic not found or has been deleted',
      );
    }

    const { isTeacherOrAdmin } = await this.checkClassAccess(
      forum.classId,
      userId,
      userRole,
    );

    return toForumEntity(forum, userId, isTeacherOrAdmin);
  }

  // Create a new discussion topic
  async create(
    classId: string,
    dto: CreateForumDto,
    userId: string,
    userRole: Role,
  ): Promise<ForumEntity> {
    await this.checkClassAccess(classId, userId, userRole);

    if (userRole === Role.teacher && dto.isAnonymous) {
      throw new BadRequestException(
        'Teachers cannot create discussion topics anonymously',
      );
    }

    const created = await this.prisma.forum.create({
      data: {
        title: dto.title,
        content: dto.content,
        isAnonymous: dto.isAnonymous ?? false,
        classId,
        createdBy: userId,
      },
      include: {
        author: {
          select: { id: true, fullName: true, avatarUrl: true, role: true },
        },
      },
    });

    return toForumEntity(created, userId, true);
  }

  // Update an existing discussion topic
  async update(
    forumId: string,
    dto: UpdateForumDto,
    userId: string,
  ): Promise<ForumEntity> {
    const forum = await this.prisma.forum.findFirst({
      where: { id: forumId, isDeleted: false },
      select: {
        id: true,
        createdBy: true,
      },
    });

    if (!forum) {
      throw new NotFoundException(
        'Discussion topic not found or has been deleted',
      );
    }

    if (forum.createdBy !== userId) {
      throw new ForbiddenException(
        'Only the author has permission to update this topic',
      );
    }

    const updated = await this.prisma.forum.update({
      where: { id: forumId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.isAnonymous !== undefined && { isAnonymous: dto.isAnonymous }),
      },
      include: {
        author: {
          select: { id: true, fullName: true, avatarUrl: true, role: true },
        },
        _count: {
          select: {
            comments: {
              where: { isDeleted: false },
            },
          },
        },
      },
    });

    return toForumEntity(updated, userId, true);
  }

  // Soft delete a discussion topic
  async remove(forumId: string, userId: string, userRole: Role): Promise<void> {
    const forum = await this.prisma.forum.findFirst({
      where: { id: forumId, isDeleted: false },
      select: {
        id: true,
        createdBy: true,
        class: {
          select: { teacherId: true },
        },
      },
    });

    if (!forum) {
      throw new NotFoundException(
        'Discussion topic not found or has been deleted',
      );
    }

    const isAuthor = forum.createdBy === userId;
    const isTeacher = forum.class.teacherId === userId;
    const isAdmin = userRole === Role.admin;

    if (!isAuthor && !isTeacher && !isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to delete this topic',
      );
    }

    await this.prisma.forum.update({
      where: { id: forumId },
      data: { isDeleted: true },
    });
  }
}
