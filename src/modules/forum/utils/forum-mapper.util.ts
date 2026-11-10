import { Role } from 'src/generated/prisma/enums';
import { ForumAuthorEntity } from '../forums/entities/forum-author.entity';
import { ForumEntity } from '../forums/entities/forum.entity';
import { CommentEntity } from '../comments/entities/comment.entity';
import {
  RawCommentInput,
  RawCommentWithReplies,
} from '../interfaces/comment.interface';
import { RawForumInput } from '../interfaces/forum.interface';

// Helper function to mask author profile for anonymous postings
export function maskForumAuthor(
  author: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    role: Role;
  },
  isAnonymous: boolean,
  authorId: string,
  currentUserId: string,
  isTeacherOrAdmin: boolean,
): ForumAuthorEntity {
  if (!isAnonymous || authorId === currentUserId || isTeacherOrAdmin) {
    return {
      id: author.id,
      fullName: author.fullName,
      avatar: author.avatarUrl ?? null,
      role: author.role,
    };
  }

  return {
    id: authorId,
    fullName: 'Anonymous Student',
    avatar: null,
    role: Role.student,
  };
}

// Maps nested comments with soft-delete masking and author privacy
export function mapCommentTree(
  rootComments: RawCommentWithReplies[],
  currentUserId: string,
  isTeacherOrAdmin: boolean,
): CommentEntity[] {
  const mappedComments: CommentEntity[] = [];

  for (const c of rootComments) {
    const activeReplies = (c.replies || []).filter((r) => !r.isDeleted);
    if (c.isDeleted && activeReplies.length === 0) {
      continue;
    }

    const commentContent = c.isDeleted
      ? '[This comment has been deleted]'
      : c.content;

    mappedComments.push({
      id: c.id,
      content: commentContent,
      isAnonymous: c.isAnonymous,
      isDeleted: c.isDeleted,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      forumId: c.forumId,
      authorId: c.authorId,
      parentId: c.parentId,
      author: maskForumAuthor(
        c.author,
        c.isAnonymous,
        c.authorId,
        currentUserId,
        isTeacherOrAdmin,
      ),
      replies: activeReplies.map((r) => ({
        id: r.id,
        content: r.content,
        isAnonymous: r.isAnonymous,
        isDeleted: r.isDeleted,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        forumId: r.forumId,
        authorId: r.authorId,
        parentId: r.parentId,
        author: maskForumAuthor(
          r.author,
          r.isAnonymous,
          r.authorId,
          currentUserId,
          isTeacherOrAdmin,
        ),
      })),
    });
  }

  return mappedComments;
}

// Transforms raw forum record with relations into standardized ForumEntity
export function toForumEntity(
  forum: RawForumInput,
  currentUserId: string,
  isTeacherOrAdmin: boolean,
): ForumEntity {
  const commentCount = forum._count?.comments ?? forum.commentCount ?? 0;
  const entity: ForumEntity = {
    id: forum.id,
    title: forum.title,
    content: forum.content,
    isAnonymous: forum.isAnonymous,
    isDeleted: forum.isDeleted,
    createdAt: forum.createdAt,
    classId: forum.classId,
    createdBy: forum.createdBy,
    commentCount,
    author: maskForumAuthor(
      forum.author,
      forum.isAnonymous,
      forum.createdBy,
      currentUserId,
      isTeacherOrAdmin,
    ),
  };

  if (forum.comments) {
    const rootComments = forum.comments.filter((c) => !c.parentId);
    entity.comments = mapCommentTree(
      rootComments,
      currentUserId,
      isTeacherOrAdmin,
    );
  }

  return entity;
}

// Transforms raw comment record with relation into standardized CommentEntity
export function toCommentEntity(
  comment: RawCommentInput,
  currentUserId: string,
  isTeacherOrAdmin: boolean,
): CommentEntity {
  return {
    id: comment.id,
    content: comment.content,
    isAnonymous: comment.isAnonymous,
    isDeleted: comment.isDeleted,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    forumId: comment.forumId,
    authorId: comment.authorId,
    parentId: comment.parentId,
    author: maskForumAuthor(
      comment.author,
      comment.isAnonymous,
      comment.authorId,
      currentUserId,
      isTeacherOrAdmin,
    ),
  };
}
