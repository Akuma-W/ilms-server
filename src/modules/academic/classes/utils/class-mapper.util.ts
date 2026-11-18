import { ClassEntity } from '../entities/class.entity';
import { StorageService } from 'src/infrastructures/storage/storage.service';

// Resolves teacher public avatar URL for a class record
export async function resolveClassTeacherAvatar<
  T extends {
    teacher?: {
      id: string;
      fullName: string;
      email: string;
      avatarUrl?: string | null;
    } | null;
  },
>(storage: StorageService, item: T): Promise<T> {
  if (!item.teacher) return item;
  const avatarUrl = await storage.getAvatarUrl(item.teacher.avatarUrl ?? null);
  return {
    ...item,
    teacher: {
      ...item.teacher,
      avatarUrl,
    },
  };
}

// Maps raw database class records into paginated list items
export function mapToClassListItem<
  T extends {
    subjectRef?: { name?: string } | null;
    enrollments?: unknown[];
    totalStudents?: number;
  },
>(cls: T): ClassEntity & { totalStudents: number; enrollment: unknown } {
  return {
    ...cls,
    subject: cls.subjectRef?.name ?? '',
    enrollment: cls.enrollments?.[0] || null,
    totalStudents: cls.totalStudents ?? 0,
  } as unknown as ClassEntity & { totalStudents: number; enrollment: unknown };
}

// Maps raw database class record into detailed view item
export function mapToClassDetailItem<
  T extends {
    subjectRef?: { name?: string } | null;
    totalStudents?: number;
  },
>(classroom: T): ClassEntity & { totalStudents: number } {
  return {
    ...classroom,
    subject: classroom.subjectRef?.name ?? '',
    totalStudents: classroom.totalStudents ?? 0,
  } as unknown as ClassEntity & { totalStudents: number };
}
