import { PrismaClient, Role } from "../../src/generated/prisma/client";
import users from './data/users.json';
import bcrypt from 'bcrypt';

export async function seedUsers(prisma: PrismaClient) {
  console.log('Seeding users...');

  // Create user in school UIT
  const seedSchool = await prisma.school.findUnique({
    where: { shortname: 'UIT' },
  });

  if (!seedSchool) {
    throw new Error('UIT not found. Please seed schools first.');
  }

  const data = await Promise.all(
    users.map(async (user) => ({
      identityCode: user.identityCode ?? null,
      email: user.email,
      password: await bcrypt.hash(user.password, 10),
      fullName: user.fullName,
      role: Role[user.role as keyof typeof Role],
      schoolId: seedSchool.id,
    }))
  );

  const result = await prisma.user.createMany({
    data,
    skipDuplicates: true,
  });

  console.log(`Inserted ${result.count} users`);
}
