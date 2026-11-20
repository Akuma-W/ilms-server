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
      subjectId: true,
      totalStudents: true,
      subjectRef: {
        select: {
          id: true,
          code: true,
          name: true,
          credits: true,
        },
      },
      semester: true,
      isPrivate: true,
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
    },
  },
};
