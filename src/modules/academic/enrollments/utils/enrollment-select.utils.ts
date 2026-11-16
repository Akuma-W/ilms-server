import { Role, EnrollmentStatus } from 'src/generated/prisma/enums';

export const enrollmentSelect = {
  id: true,
  userId: true,
  classId: true,
  roleIn: true,
  isStarred: true,
  status: true,
  joinedAt: true,

  class: {
    select: {
      id: true,
      title: true,
      description: true,
      courseCode: true,
      subject: true,
      semester: true,
      isPrivate: true,
      meetingUri: true,
      meetingSpaceId: true,
      isArchived: true,
      createdAt: true,
      schoolId: true,
      teacherId: true,
      school: {
        select: {
          id: true,
          name: true,
        },
      },
      teacher: {
        select: {
          id: true,
          fullName: true,
          email: true,
          avatarUrl: true,
          role: true,
        },
      },
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
    },
  },
};
