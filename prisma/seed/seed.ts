import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client';
import { seedSchools } from './schools.seed';
import { seedUsers } from './users.seed';
import { seedClasses } from './classes.seed';
import { seedEnrollments } from './enrollments.seed';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Start seeding...');

  await seedSchools(prisma);
  await seedUsers(prisma);
  await seedClasses(prisma);
  await seedEnrollments(prisma);

  console.log('Seeding completed');
}

main()
  .catch((error) => {
    console.error('Seed failed:');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
