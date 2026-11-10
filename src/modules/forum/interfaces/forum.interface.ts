import { Role } from 'src/generated/prisma/enums';
import { RawCommentWithReplies } from './comment.interface';

export interface RawForumInput {
  id: string;
  title: string;
  content: string;
  isAnonymous: boolean;
  isDeleted: boolean;
  createdAt: Date | null;
  classId: string;
  createdBy: string;
  author: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    role: Role;
  };
  _count?: {
    comments?: number;
  };
  commentCount?: number;
  comments?: RawCommentWithReplies[];
}
