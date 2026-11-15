import { EnrollmentStatus } from 'src/generated/prisma/enums';

export const PROFILE_CLASS_INCLUDE = {
  teacher: {
    select: {
      id: true,
      fullName: true,
      email: true,
      avatarUrl: true,
    },
  },
  _count: {
    select: {
      enrollments: {
        where: { status: EnrollmentStatus.approved },
      },
      topics: true,
      assignments: true,
      quizPublications: true,
    },
  },
} as const;
