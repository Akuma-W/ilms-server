import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';
import { GradeSubmissionDto } from './dto/grade-submission.dto';

/**
 * Service managing student assignment submissions and instructor grading.
 */
@Injectable()
export class SubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Submits student work for an assignment (creates or updates draft submission).
   */
  async submit(userId: string, assignmentId: string, dto: SubmitAssignmentDto) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment does not exist');
    }

    const now = new Date();
    const isLate = assignment.dueAt ? now > new Date(assignment.dueAt) : false;

    const existing = await this.prisma.submission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: userId,
        },
      },
    });

    const result = await this.prisma.$transaction(async (tx) => {
      if (existing) {
        if (dto.files !== undefined) {
          await tx.submissionFile.deleteMany({
            where: { submissionId: existing.id },
          });

          if (dto.files.length > 0) {
            await tx.submissionFile.createMany({
              data: dto.files.map((f) => ({
                submissionId: existing.id,
                fileUrl: f.fileUrl,
                fileType: f.fileType,
              })),
            });
          }
        }

        return tx.submission.update({
          where: { id: existing.id },
          data: {
            textAnswer:
              dto.textAnswer !== undefined
                ? dto.textAnswer
                : existing.textAnswer,
            isLate,
            submittedAt: now,
          },
          include: {
            student: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
              },
            },
            files: true,
          },
        });
      }

      return tx.submission.create({
        data: {
          assignmentId,
          studentId: userId,
          textAnswer: dto.textAnswer,
          isLate,
          submittedAt: now,
          files: dto.files?.length
            ? {
                create: dto.files.map((f) => ({
                  fileUrl: f.fileUrl,
                  fileType: f.fileType,
                })),
              }
            : undefined,
        },
        include: {
          student: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatarUrl: true,
            },
          },
          files: true,
        },
      });
    });

    return {
      message: 'Submit assignment successful',
      data: result,
    };
  }

  /**
   * Updates an existing student submission.
   */
  async update(userId: string, id: string, dto: SubmitAssignmentDto) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
      include: { assignment: true },
    });

    if (!submission) {
      throw new NotFoundException('Submission does not exist');
    }

    if (submission.studentId !== userId) {
      throw new ForbiddenException(
        'You cannot update another student submission',
      );
    }

    const now = new Date();
    const isLate = submission.assignment.dueAt
      ? now > new Date(submission.assignment.dueAt)
      : false;

    const result = await this.prisma.$transaction(async (tx) => {
      if (dto.files !== undefined) {
        await tx.submissionFile.deleteMany({
          where: { submissionId: id },
        });

        if (dto.files.length > 0) {
          await tx.submissionFile.createMany({
            data: dto.files.map((f) => ({
              submissionId: id,
              fileUrl: f.fileUrl,
              fileType: f.fileType,
            })),
          });
        }
      }

      return tx.submission.update({
        where: { id },
        data: {
          textAnswer:
            dto.textAnswer !== undefined
              ? dto.textAnswer
              : submission.textAnswer,
          isLate,
          submittedAt: now,
        },
        include: {
          student: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatarUrl: true,
            },
          },
          files: true,
        },
      });
    });

    return {
      message: 'Update submission successful',
      data: result,
    };
  }

  /**
   * Evaluates and records teacher grade and feedback for a submission.
   */
  async grade(teacherId: string, id: string, dto: GradeSubmissionDto) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
      include: {
        assignment: {
          include: { class: true },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission does not exist');
    }

    await this.checkTeacher(teacherId, submission.assignment.classId);

    if (
      submission.assignment.maxScore !== null &&
      submission.assignment.maxScore !== undefined &&
      dto.score > submission.assignment.maxScore
    ) {
      throw new BadRequestException(
        'Score cannot exceed maximum score of assignment',
      );
    }

    const updated = await this.prisma.submission.update({
      where: { id },
      data: {
        score: dto.score,
        feedback: dto.feedback,
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
        files: true,
      },
    });

    return {
      message: 'Grade submission successful',
      data: updated,
    };
  }

  /**
   * Cancels/unsubmits student work and deletes submitted files.
   */
  async delete(userId: string, id: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw new NotFoundException('Submission does not exist');
    }

    if (submission.studentId !== userId) {
      throw new ForbiddenException(
        'You cannot cancel another student submission',
      );
    }

    if (submission.score !== null && submission.score !== undefined) {
      throw new BadRequestException(
        'Cannot cancel submission that has already been graded',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.submissionFile.deleteMany({
        where: { submissionId: id },
      });
      await tx.submission.delete({
        where: { id },
      });
    });

    return {
      message: 'Cancel submission successful',
    };
  }

  /**
   * Helper verifying teacher privileges for a class.
   */
  private async checkTeacher(userId: string, classId: string) {
    const user = await this.prisma.user?.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (user?.role === 'admin') {
      return;
    }

    const classroom = await this.prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classroom) {
      throw new NotFoundException('Class does not exist');
    }

    if (classroom.teacherId === userId) {
      return;
    }

    const enrollment = await this.prisma.enrollment.findFirst({
      where: { userId, classId },
    });

    if (
      !enrollment ||
      enrollment.roleIn !== 'teacher' ||
      enrollment.status !== 'approved'
    ) {
      throw new ForbiddenException('You are not teacher of class');
    }
  }
}
