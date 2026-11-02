import { PrismaClient, Role } from "../../src/generated/prisma/client";
import classes from './data/classes.json';

export async function seedClasses(prisma: PrismaClient) {
  console.log('Seeding classes...');

  const seedTeacher = await prisma.user.findFirst({
    where: { role: Role.teacher },
  });

  if (!seedTeacher) {
    throw new Error('Teacher not found. Please seed user first.');
  }

  const data = await Promise.all(
classes.map(async (cls) => {
    const { teacherId, ...classData } = cls;
    
    const teacher = await prisma.user.findFirstOrThrow({
      where: {
        identityCode: teacherId,
      },
    });

    return {
      ...classData,
      schoolId: teacher?.schoolId,
      teacherId: teacher?.id,
      createdAt: new Date(),
    }
  })
  );

  const result = await prisma.class.createMany({
    data,
    skipDuplicates: true,
  });

  console.log(`Inserted ${result.count} classes`);
}
