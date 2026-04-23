import { EnrollmentStatus, PrismaClient, Role } from "../../src/generated/prisma/client";

export async function seedEnrollments(prisma: PrismaClient) {
  console.log('Seeding enrollments...');

  const classes = await prisma.class.findMany();
  const students = await prisma.user.findMany({
    where: { role: Role.student }
  });

  if (!classes.length) {
    throw new Error('No classes found. Seed classes first.')
  }

  if (!students.length) {
    throw new Error('No students found. Seed users first.')
  }

  const enrollments = []

  for (const cls of classes) {
    // teacher enrollment
    enrollments.push({
      roleIn: Role.teacher,
      classId: cls.id,
      userId: cls.teacherId,
      status: EnrollmentStatus.approved,
      joinedAt: new Date(),
    });

    for (const student of students) {
      enrollments.push({
        roleIn: Role.student,
        classId: cls.id,
        userId: student.id,
        status: student.identityCode === 'SV0001' ? EnrollmentStatus.approved : EnrollmentStatus.pending,
        joinedAt: new Date(),
      });
    };
  };

  const result = await prisma.enrollment.createMany({
    data: enrollments,
    skipDuplicates: true,
  });

  console.log(`Inserted ${result.count} enrollments`);
}