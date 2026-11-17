// Reusable Prisma include object for class detail views
export const classDetailInclude = {
  teacher: true,
  school: true,
  subjectRef: true,
};

// Reusable Prisma include generator for class catalog views
export function getClassListInclude(userId: string) {
  return {
    teacher: true,
    school: true,
    subjectRef: true,
    enrollments: { where: { userId } },
  };
}
