import { ClassEntity } from '../entities/class.entity';

// Maps raw database class records into paginated list items
export function mapToClassListItem<
  T extends {
    subjectRef?: { name?: string } | null;
    enrollments?: unknown[];
    _count?: { enrollments?: number };
  },
>(cls: T): ClassEntity & { totalStudents: number; enrollment: unknown } {
  return {
    ...cls,
    subject: cls.subjectRef?.name ?? '',
    enrollment: cls.enrollments?.[0] || null,
    totalStudents: cls._count?.enrollments ?? 0,
  } as unknown as ClassEntity & { totalStudents: number; enrollment: unknown };
}

// Maps raw database class record into detailed view item
export function mapToClassDetailItem<
  T extends {
    subjectRef?: { name?: string } | null;
    _count?: { enrollments?: number };
  },
>(classroom: T): ClassEntity & { totalStudents: number } {
  return {
    ...classroom,
    subject: classroom.subjectRef?.name ?? '',
    totalStudents: classroom._count?.enrollments ?? 0,
  } as unknown as ClassEntity & { totalStudents: number };
}
