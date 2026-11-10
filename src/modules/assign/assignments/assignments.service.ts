import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';

/**
 * Service managing classroom assignments, attachments, and permissions.
 */
@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new assignment with optional resource materials.
   */
  async create(userId: string, classId: string, dto: CreateAssignmentDto) {
    const classroom = await this.prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classroom) {
      throw new NotFoundException('Class does not exist');
    }

    await this.checkTeacher(userId, classId);

    if (dto.topicId) {
      const topic = await this.prisma.topic.findUnique({
        where: { id: dto.topicId },
      });
      if (!topic || topic.classId !== classId) {
        throw new BadRequestException('Topic does not belong to this class');
      }
    }

    const assignment = await this.prisma.assignment.create({
      data: {
        title: dto.title,
        description: dto.description,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        maxScore: dto.maxScore ?? 10,
        classId,
        topicId: dto.topicId ? dto.topicId : null,
        createdBy: userId,
        materials: dto.materials?.length
          ? {
              create: dto.materials.map((m) => ({
                fileUrl: m.fileUrl,
                fileType: m.fileType,
              })),
            }
          : undefined,
      },
      include: {
        materials: true,
      },
    });

    return {
      message: 'Create assignment successful',
      data: assignment,
    };
  }

  /**
   * Retrieves all assignments for a class with calculated metrics.
   */
  async findAllByClass(userId: string, classId: string) {
    const classroom = await this.prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classroom) {
      throw new NotFoundException('Class does not exist');
    }

    const isTeacher = await this.isUserTeacher(userId, classroom);

    const totalStudents = await this.prisma.enrollment.count({
      where: { classId, roleIn: 'student', status: 'approved' },
    });

    const assignments = await this.prisma.assignment.findMany({
      where: { classId },
      include: {
        materials: true,
        submissions: {
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
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return assignments.map((a) => {
      const allSubmissions = a.submissions || [];
      const submissionCount = allSubmissions.length;

      const submissions = isTeacher
        ? allSubmissions
        : allSubmissions.filter((s) => s.studentId === userId);

      return {
        ...a,
        submissions,
        submissionCount,
        totalStudents,
      };
    });
  }

  /**
   * Retrieves a single assignment by ID.
   */
  async findOne(userId: string, id: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: {
        class: true,
        materials: true,
        submissions: {
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
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment does not exist');
    }

    const isTeacher = await this.isUserTeacher(userId, assignment.class);

    const totalStudents = await this.prisma.enrollment.count({
      where: {
        classId: assignment.classId,
        roleIn: 'student',
        status: 'approved',
      },
    });

    const allSubmissions = assignment.submissions || [];
    const submissionCount = allSubmissions.length;
    const submissions = isTeacher
      ? allSubmissions
      : allSubmissions.filter((s) => s.studentId === userId);

    return {
      ...assignment,
      submissions,
      submissionCount,
      totalStudents,
    };
  }

  /**
   * Updates an existing assignment and optionally replaces its materials.
   */
  async update(userId: string, id: string, dto: UpdateAssignmentDto) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment does not exist');
    }

    await this.checkTeacher(userId, assignment.classId);

    if (dto.topicId) {
      const topic = await this.prisma.topic.findUnique({
        where: { id: dto.topicId },
      });
      if (!topic || topic.classId !== assignment.classId) {
        throw new BadRequestException('Topic does not belong to this class');
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.materials !== undefined) {
        await tx.assignmentMaterials.deleteMany({
          where: { assignmentId: id },
        });

        if (dto.materials.length > 0) {
          await tx.assignmentMaterials.createMany({
            data: dto.materials.map((m) => ({
              assignmentId: id,
              fileUrl: m.fileUrl,
              fileType: m.fileType,
            })),
          });
        }
      }

      return tx.assignment.update({
        where: { id },
        data: {
          title: dto.title,
          description: dto.description,
          dueAt: dto.dueAt
            ? new Date(dto.dueAt)
            : dto.dueAt === null
              ? null
              : undefined,
          maxScore: dto.maxScore,
          topicId:
            dto.topicId !== undefined
              ? dto.topicId
                ? dto.topicId
                : null
              : undefined,
        },
        include: {
          materials: true,
        },
      });
    });

    return {
      message: 'Update assignment successful',
      data: updated,
    };
  }

  /**
   * Deletes an assignment and cleanly removes all dependent submissions and files.
   */
  async delete(userId: string, id: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment does not exist');
    }

    await this.checkTeacher(userId, assignment.classId);

    await this.prisma.$transaction(async (tx) => {
      const submissions = await tx.submission.findMany({
        where: { assignmentId: id },
        select: { id: true },
      });

      const submissionIds = submissions.map((s) => s.id);

      if (submissionIds.length > 0) {
        await tx.submissionFile.deleteMany({
          where: { submissionId: { in: submissionIds } },
        });
        await tx.submission.deleteMany({
          where: { assignmentId: id },
        });
      }

      await tx.assignmentMaterials.deleteMany({
        where: { assignmentId: id },
      });

      await tx.assignment.delete({
        where: { id },
      });
    });

    return {
      message: 'Delete assignment successful',
    };
  }

  /**
   * Verifies if user has instructor privileges for the class.
   */
  private async checkTeacher(userId: string, classId: string) {
    const classroom = await this.prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classroom) {
      throw new NotFoundException('Class does not exist');
    }

    const isTeacher = await this.isUserTeacher(userId, classroom);
    if (!isTeacher) {
      throw new ForbiddenException('You are not teacher of class');
    }
  }

  /**
   * Helper checking whether user is instructor or enrolled teacher.
   */
  private async isUserTeacher(
    userId: string,
    classroom: { id: string; teacherId: string },
  ): Promise<boolean> {
    if (classroom.teacherId === userId) {
      return true;
    }

    const user = await this.prisma.user?.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (user?.role === 'admin') {
      return true;
    }

    const enrollment = await this.prisma.enrollment.findFirst({
      where: { userId, classId: classroom.id },
    });

    return (
      !!enrollment &&
      enrollment.roleIn === 'teacher' &&
      enrollment.status === 'approved'
    );
  }
}
