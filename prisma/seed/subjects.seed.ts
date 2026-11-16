import { PrismaClient } from '../../src/generated/prisma/client';
import subjects from './data/subjects.json';

export async function seedSubjects(prisma: PrismaClient) {
  console.log('Seeding subjects...');

  const uit = await prisma.school.findUnique({
    where: { shortname: 'UIT' },
  });

  if (!uit) {
    console.warn('UIT school not found, skipping subject seed.');
    return;
  }

  const data = subjects.map((subject) => ({
    schoolId: uit.id,
    ...subject,
  }));

  for (const subject of data) {
    await prisma.subject.upsert({
      where: {
        schoolId_code: {
          schoolId: subject.schoolId,
          code: subject.code,
        },
      },
      update: {
        name: subject.name,
        description: subject.description,
        credits: subject.credits,
        isActive: subject.isActive,
      },
      create: subject,
    });
  }

  console.log(`Seeded ${subjects.length} subjects for UIT`);
}
