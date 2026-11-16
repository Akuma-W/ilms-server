import { EnrollmentStatus, Role } from 'src/generated/prisma/enums';

// Reusable Prisma include object for class detail views
export const classDetailInclude = {
  teacher: true,
  school: true,
  subjectRef: true,
  _count: {
    select: {
      enrollments: {
        where: {
          roleIn: Role.student,
          status: EnrollmentStatus.approved,
        },
      },
    },
  },
};

// Reusable Prisma include generator for class catalog views
export function getClassListInclude(userId: string) {
  return {
    teacher: true,
    school: true,
    subjectRef: true,
    enrollments: { where: { userId } },
    _count: {
      select: {
        enrollments: {
          where: {
            roleIn: Role.student,
            status: EnrollmentStatus.approved,
          },
        },
      },
    },
  };
}
