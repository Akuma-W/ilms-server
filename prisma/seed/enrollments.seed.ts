import { randomInt } from "crypto";
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

  for (const c of classes) {
    // teacher enrollment
    enrollments.push({
      roleIn: Role.teacher,
      classId: c.id,
      userId: c.teacherId,
      status: EnrollmentStatus.approved,
      joinedAt: new Date(),
    })

    // random students
    const randomStudents = students
      .sort(() => 0.5 - Math.random())
      .slice(0, randomInt(10, 30))

    for (const student of randomStudents) {
      enrollments.push({
        roleIn: Role.student,
        classId: c.id,
        userId: student.id,
        joinedAt: new Date(),
      })
    }
  }

  const result = await prisma.enrollment.createMany({
    data: enrollments,
    skipDuplicates: true,
  })

  console.log(`Inserted ${result.count} enrollments`)
}