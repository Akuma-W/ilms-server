import { PrismaClient } from '../../src/generated/prisma/client';
import schools from './data/hcmc_universities.json';

export async function seedSchools(prisma: PrismaClient) {
  console.log('Seeding schools...');
  
  const result = await prisma.school.createMany({
    data: schools,
    skipDuplicates: true,
  });

  console.log(`Inserted ${result.count} schools`);
}
