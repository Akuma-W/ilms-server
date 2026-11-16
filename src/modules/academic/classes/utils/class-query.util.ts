import { Prisma } from 'src/generated/prisma/client';

// Builds query where clause for public school classes
export function buildClassListWhere(
  schoolId: string,
  search?: string,
  isArchived?: boolean,
  subjectId?: string,
): Prisma.ClassWhereInput {
  const where: Prisma.ClassWhereInput = {
    isPrivate: false,
    schoolId,
    isArchived: isArchived !== undefined ? isArchived : false,
    ...(subjectId && { subjectId }),
  };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { subjectRef: { name: { contains: search, mode: 'insensitive' } } },
      { subjectRef: { code: { contains: search, mode: 'insensitive' } } },
      { semester: { contains: search, mode: 'insensitive' } },
      { teacher: { fullName: { contains: search, mode: 'insensitive' } } },
    ];
  }

  return where;
}

// Builds query where clause for teaching classes of a specific teacher
export function buildTeachingClassesWhere(
  teacherId: string,
  keyword?: string,
  isArchived?: boolean,
  subjectId?: string,
): Prisma.ClassWhereInput {
  const where: Prisma.ClassWhereInput = {
    teacherId,
    ...(isArchived !== undefined && { isArchived }),
    ...(subjectId && { subjectId }),
  };

  if (keyword) {
    where.OR = [
      { title: { contains: keyword, mode: 'insensitive' } },
      { subjectRef: { name: { contains: keyword, mode: 'insensitive' } } },
      { subjectRef: { code: { contains: keyword, mode: 'insensitive' } } },
      { semester: { contains: keyword, mode: 'insensitive' } },
    ];
  }

  return where;
}
