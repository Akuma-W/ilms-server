import { EnrollmentStatus, Role } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';

// Enrolls assistant teachers into class during class creation
export async function enrollClassAssistants(
  prisma: PrismaService,
  classId: string,
  schoolId: string,
  teacherId: string,
  assistantIds?: string[],
): Promise<void> {
  if (
    !assistantIds ||
    !Array.isArray(assistantIds) ||
    assistantIds.length === 0
  ) {
    return;
  }

  const uniqueAssistantIds = [
    ...new Set(assistantIds.filter((id) => id !== teacherId)),
  ];

  for (const assistantId of uniqueAssistantIds) {
    const userExists = await prisma.user.findUnique({
      where: { id: assistantId },
      select: { id: true, schoolId: true },
    });
    if (userExists && userExists.schoolId === schoolId) {
      await prisma.enrollment.create({
        data: {
          classId,
          userId: assistantId,
          roleIn: Role.teacher,
          status: EnrollmentStatus.approved,
          joinedAt: new Date(),
        },
      });
    }
  }
}
