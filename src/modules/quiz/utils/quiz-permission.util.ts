import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';

// Find quiz by id or throw not found
export async function findQuizOrThrow(
  prisma: PrismaService,
  quizId: string,
): Promise<{
  id: string;
  createdBy: string;
  visibility: string;
  status: string;
  title: string;
}> {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: {
      id: true,
      createdBy: true,
      visibility: true,
      status: true,
      title: true,
    },
  });
  if (!quiz) {
    throw new NotFoundException('Quiz not found');
  }
  return quiz;
}

// Check if user is the creator of the quiz
export async function checkQuizOwnership(
  prisma: PrismaService,
  quizId: string,
  userId: string,
): Promise<void> {
  const quiz = await findQuizOrThrow(prisma, quizId);
  if (quiz.createdBy !== userId) {
    throw new ForbiddenException(
      'You do not have permission to modify this quiz',
    );
  }
}

// Check if user is the assigned teacher of the class
export async function checkClassTeacherPermission(
  prisma: PrismaService,
  classId: string,
  userId: string,
): Promise<void> {
  const classItem = await prisma.class.findUnique({
    where: { id: classId },
    select: { id: true, teacherId: true },
  });
  if (!classItem) {
    throw new NotFoundException('Class not found');
  }
  if (classItem.teacherId !== userId) {
    throw new ForbiddenException(
      'Only the teacher of this class can perform this action',
    );
  }
}
