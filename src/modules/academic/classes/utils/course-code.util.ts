import { generateRandomCode } from 'src/common/utils/random.util';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';

// Generates an uppercase 6-character alphanumeric code
export function generateCourseCode(): string {
  return generateRandomCode(6);
}

// Generates an unique course code with retry mechanism
export async function generateUniqueCourseCode(
  prisma: PrismaService,
): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = generateCourseCode();

    const found = await prisma.class.findUnique({
      where: { courseCode: code },
    });

    if (!found) return code;
  }
  throw new Error('Failed to generate unique course code');
}
