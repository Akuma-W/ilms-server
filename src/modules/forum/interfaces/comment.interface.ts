import { Role } from 'src/generated/prisma/enums';

export interface RawCommentInput {
  id: string;
  content: string;
  isAnonymous: boolean;
  isDeleted: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
  forumId: string;
  authorId: string;
  parentId: string | null;
  author: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    role: Role;
  };
}

export interface RawCommentWithReplies {
  id: string;
  content: string;
  isAnonymous: boolean;
  isDeleted: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
  forumId: string;
  authorId: string;
  parentId: string | null;
  author: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    role: Role;
  };
  replies?: Array<{
    id: string;
    content: string;
    isAnonymous: boolean;
    isDeleted: boolean;
    createdAt: Date | null;
    updatedAt: Date | null;
    forumId: string;
    authorId: string;
    parentId: string | null;
    author: {
      id: string;
      fullName: string;
      avatarUrl?: string | null;
      role: Role;
    };
  }>;
}
