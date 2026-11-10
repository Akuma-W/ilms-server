import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { EnrollmentStatus, Role } from 'src/generated/prisma/enums';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentEntity } from './entities/comment.entity';
import { toCommentEntity } from '../utils/forum-mapper.util';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper method to verify forum existence and user classroom membership
  private async checkForumAccess(
    forumId: string,
    userId: string,
    userRole: Role,
  ) {
    const forum = await this.prisma.forum.findFirst({
      where: { id: forumId, isDeleted: false },
      select: {
        id: true,
        classId: true,
        class: {
          select: { id: true, teacherId: true },
        },
      },
    });

    if (!forum) {
      throw new NotFoundException(
        'Discussion topic not found or has been deleted',
      );
    }

    if (userRole === Role.admin || forum.class.teacherId === userId) {
      return { forum, isTeacherOrAdmin: true };
    }

    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        classId: forum.classId,
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

    return { forum, isTeacherOrAdmin: false };
  }

  // Create a new comment or reply to an existing comment
  async create(
    forumId: string,
    dto: CreateCommentDto,
    userId: string,
    userRole: Role,
  ): Promise<CommentEntity> {
    const { isTeacherOrAdmin } = await this.checkForumAccess(
      forumId,
      userId,
      userRole,
    );

    if (userRole === Role.teacher && dto.isAnonymous) {
      throw new BadRequestException(
        'Teachers cannot post comments anonymously',
      );
    }

    if (dto.parentId) {
      const parentComment = await this.prisma.comment.findFirst({
        where: { id: dto.parentId, isDeleted: false },
        select: { id: true, forumId: true, parentId: true },
      });

      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }

      if (parentComment.forumId !== forumId) {
        throw new BadRequestException(
          'Parent comment does not belong to this discussion topic',
        );
      }

      if (parentComment.parentId) {
        throw new BadRequestException(
          'Deep nested replies beyond 1 level are not allowed',
        );
      }
    }

    const created = await this.prisma.comment.create({
      data: {
        content: dto.content,
        isAnonymous: dto.isAnonymous ?? false,
        forumId,
        authorId: userId,
        parentId: dto.parentId ?? null,
      },
      include: {
        author: {
          select: { id: true, fullName: true, avatarUrl: true, role: true },
        },
      },
    });

    return toCommentEntity(created, userId, isTeacherOrAdmin);
  }

  // Update an existing comment in a discussion
  async update(
    forumId: string,
    commentId: string,
    dto: UpdateCommentDto,
    userId: string,
  ): Promise<CommentEntity> {
    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, isDeleted: false },
      select: {
        id: true,
        authorId: true,
        forumId: true,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found or has been deleted');
    }

    if (comment.forumId !== forumId) {
      throw new BadRequestException(
        'Comment does not belong to this discussion topic',
      );
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException(
        'Only the author has permission to update this comment',
      );
    }

    const updated = await this.prisma.comment.update({
      where: { id: commentId },
      data: {
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.isAnonymous !== undefined && { isAnonymous: dto.isAnonymous }),
      },
      include: {
        author: {
          select: { id: true, fullName: true, avatarUrl: true, role: true },
        },
      },
    });

    return toCommentEntity(updated, userId, true);
  }

  // Soft delete a comment
  async remove(
    forumId: string,
    commentId: string,
    userId: string,
    userRole: Role,
  ): Promise<void> {
    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, isDeleted: false },
      select: {
        id: true,
        forumId: true,
        authorId: true,
        forum: {
          select: {
            class: {
              select: { teacherId: true },
            },
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found or has been deleted');
    }

    if (comment.forumId !== forumId) {
      throw new BadRequestException(
        'Comment does not belong to this discussion topic',
      );
    }

    const isAuthor = comment.authorId === userId;
    const isTeacher = comment.forum.class.teacherId === userId;
    const isAdmin = userRole === Role.admin;

    if (!isAuthor && !isTeacher && !isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to delete this comment',
      );
    }

    await this.prisma.comment.update({
      where: { id: commentId },
      data: { isDeleted: true },
    });
  }
}
