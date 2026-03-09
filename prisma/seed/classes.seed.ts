import { PrismaClient } from "../../src/generated/prisma/client";
import classes from './data/classes.json';

export async function seedClasses(prisma: PrismaClient) {
  console.log('Seeding classes...');

  const data = classes.map((cls) => {
    return {
      ...cls,
      createdAt: new Date(),
    }
  })

  const result = await prisma.class.createMany({
    data,
    skipDuplicates: true,
  });

  console.log(`Inserted ${result.count} classes`);
}
