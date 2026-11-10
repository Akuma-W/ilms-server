import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { ClassMembersService } from './class-members.service';
import { EnrollmentStatus, Role } from 'src/generated/prisma/enums';

describe('ClassMembersService', () => {
  let service: ClassMembersService;
  let prismaMock: {
    class: {
      findUnique: jest.Mock;
    };
    enrollment: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  const mockTeacher = {
    id: 'teacher-uuid',
    fullName: 'Teacher Name',
    email: 'teacher@test.com',
    avatarUrl: null,
    identityCode: 'GV001',
    role: Role.teacher,
    schoolId: 'school-uuid',
  };

  const mockStudent = {
    id: 'student-uuid',
    fullName: 'Student Name',
    email: 'student@test.com',
    avatarUrl: null,
    identityCode: 'SV001',
    role: Role.student,
    schoolId: 'school-uuid',
  };

  const mockClass = {
    id: 'class-uuid',
    title: 'Test Class',
    teacherId: 'teacher-uuid',
    schoolId: 'school-uuid',
    teacher: mockTeacher,
    createdAt: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    prismaMock = {
      class: {
        findUnique: jest.fn(),
      },
      enrollment: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassMembersService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<ClassMembersService>(ClassMembersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMembers', () => {
    it('should throw NotFoundException when class does not exist', async () => {
      prismaMock.class.findUnique.mockResolvedValue(null);

      await expect(
        service.getMembers('teacher-uuid', 'non-existent-class'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return class members including head teacher and students', async () => {
      prismaMock.class.findUnique.mockResolvedValue(mockClass);
      prismaMock.enrollment.findMany.mockResolvedValue([
        {
          id: 'en-1',
          userId: 'student-uuid',
          classId: 'class-uuid',
          roleIn: Role.student,
          status: EnrollmentStatus.approved,
          joinedAt: new Date(),
          user: mockStudent,
        },
      ]);

      const result = await service.getMembers('teacher-uuid', 'class-uuid');
      expect(result).toHaveLength(2);
      expect(result[0].role).toBe(Role.teacher);
      expect(result[1].role).toBe(Role.student);
      expect(result[1].studentCode).toBe('SV001');
    });
  });

  describe('approveMember', () => {
    it('should approve a pending member', async () => {
      prismaMock.class.findUnique.mockResolvedValue(mockClass);
      prismaMock.enrollment.findFirst.mockResolvedValue({
        id: 'en-pending',
        userId: 'student-uuid',
        classId: 'class-uuid',
        status: EnrollmentStatus.pending,
        user: mockStudent,
      });
      prismaMock.enrollment.update.mockResolvedValue({
        id: 'en-pending',
        status: EnrollmentStatus.approved,
      });

      const res = await service.approveMember(
        'teacher-uuid',
        'class-uuid',
        'en-pending',
      );
      expect(res.message).toBe('Approve enrollment successful');
      expect(res.data.status).toBe(EnrollmentStatus.approved);
    });

    it('should throw BadRequestException when member is not pending', async () => {
      prismaMock.class.findUnique.mockResolvedValue(mockClass);
      prismaMock.enrollment.findFirst.mockResolvedValue({
        id: 'en-approved',
        userId: 'student-uuid',
        classId: 'class-uuid',
        status: EnrollmentStatus.approved,
        user: mockStudent,
      });

      await expect(
        service.approveMember('teacher-uuid', 'class-uuid', 'en-approved'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('rejectMember', () => {
    it('should reject a pending member', async () => {
      prismaMock.class.findUnique.mockResolvedValue(mockClass);
      prismaMock.enrollment.findFirst.mockResolvedValue({
        id: 'en-pending',
        userId: 'student-uuid',
        classId: 'class-uuid',
        status: EnrollmentStatus.pending,
        user: mockStudent,
      });
      prismaMock.enrollment.update.mockResolvedValue({
        id: 'en-pending',
        status: EnrollmentStatus.rejected,
      });

      const res = await service.rejectMember(
        'teacher-uuid',
        'class-uuid',
        'en-pending',
      );
      expect(res.message).toBe('Reject enrollment successful');
      expect(res.data.status).toBe(EnrollmentStatus.rejected);
    });
  });

  describe('removeMember', () => {
    it('should throw ForbiddenException when attempting to remove class owner', async () => {
      prismaMock.class.findUnique.mockResolvedValue(mockClass);
      prismaMock.enrollment.findFirst.mockResolvedValue({
        id: 'en-owner',
        userId: 'teacher-uuid',
        classId: 'class-uuid',
        roleIn: Role.teacher,
        user: mockTeacher,
      });

      await expect(
        service.removeMember('teacher-uuid', 'class-uuid', 'en-owner'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should delete enrollment when removing a regular student', async () => {
      prismaMock.class.findUnique.mockResolvedValue(mockClass);
      prismaMock.enrollment.findFirst.mockResolvedValue({
        id: 'en-student',
        userId: 'student-uuid',
        classId: 'class-uuid',
        roleIn: Role.student,
        user: mockStudent,
      });
      prismaMock.enrollment.delete.mockResolvedValue({});

      const res = await service.removeMember(
        'teacher-uuid',
        'class-uuid',
        'en-student',
      );
      expect(res.message).toBe('Remove member successful');
    });
  });

  describe('updateMemberRole', () => {
    it('should throw BadRequestException if changing head teacher role to student', async () => {
      prismaMock.class.findUnique.mockResolvedValue(mockClass);
      prismaMock.enrollment.findFirst.mockResolvedValue({
        id: 'en-owner',
        userId: 'teacher-uuid',
        classId: 'class-uuid',
        roleIn: Role.teacher,
        user: mockTeacher,
      });

      await expect(
        service.updateMemberRole(
          'teacher-uuid',
          'class-uuid',
          'en-owner',
          Role.student,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update role of assistant to student or vice versa', async () => {
      prismaMock.class.findUnique.mockResolvedValue(mockClass);
      prismaMock.enrollment.findFirst.mockResolvedValue({
        id: 'en-student',
        userId: 'student-uuid',
        classId: 'class-uuid',
        roleIn: Role.student,
        user: mockStudent,
      });
      prismaMock.enrollment.update.mockResolvedValue({
        id: 'en-student',
        roleIn: Role.teacher,
      });

      const res = await service.updateMemberRole(
        'teacher-uuid',
        'class-uuid',
        'en-student',
        Role.teacher,
      );
      expect(res.message).toBe('Update member role successful');
      expect(res.data.roleIn).toBe(Role.teacher);
    });
  });
});
