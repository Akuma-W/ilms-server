import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { StorageService } from 'src/infrastructures/storage/storage.service';
import { ClassMembersService } from './class-members.service';
import { EnrollmentStatus, Role } from 'src/generated/prisma/enums';

describe('ClassMembersService', () => {
  let service: ClassMembersService;
  let prismaMock: {
    class: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    user: {
      findUnique: jest.Mock;
    };
    enrollment: {
      create: jest.Mock;
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
    totalStudents: 0,
    maxStudents: 60,
  };

  beforeEach(async () => {
    prismaMock = {
      class: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      enrollment: {
        create: jest.fn(),
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
        {
          provide: StorageService,
          useValue: {
            getUrl: jest
              .fn()
              .mockImplementation((path: string) =>
                Promise.resolve(`http://localhost:9000/${path}`),
              ),
            getAvatarUrl: jest
              .fn()
              .mockImplementation((path: string | null) => {
                if (!path) return Promise.resolve(null);
                const clean = path.startsWith('/') ? path.slice(1) : path;
                return Promise.resolve(`http://localhost:9000/${clean}`);
              }),
          },
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

      await expect(service.getMembers('non-existent-class')).rejects.toThrow(
        NotFoundException,
      );
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

      const result = await service.getMembers('class-uuid');
      expect(result).toHaveLength(2);
      expect(result[0].role).toBe(Role.teacher);
      expect(result[1].role).toBe(Role.student);
    });

    it('should resolve avatarUrl for members and owner teacher', async () => {
      prismaMock.class.findUnique.mockResolvedValue({
        ...mockClass,
        teacher: { ...mockTeacher, avatarUrl: 'avatars/teacher.png' },
      });
      prismaMock.enrollment.findMany.mockResolvedValue([
        {
          id: 'en-1',
          userId: 'student-uuid',
          classId: 'class-uuid',
          roleIn: Role.student,
          status: EnrollmentStatus.approved,
          joinedAt: new Date(),
          user: { ...mockStudent, avatarUrl: '/avatars/student.png' },
        },
      ]);

      const result = await service.getMembers('class-uuid');
      expect(result).toHaveLength(2);
      expect(result[0].user.avatarUrl).toBe(
        'http://localhost:9000/avatars/teacher.png',
      );
      expect(result[1].user.avatarUrl).toBe(
        'http://localhost:9000/avatars/student.png',
      );
    });
  });

  describe('addAssistant', () => {
    it('should throw ForbiddenException if user is not head teacher or admin', async () => {
      prismaMock.class.findUnique.mockResolvedValue(mockClass);

      await expect(
        service.addAssistant(
          'class-uuid',
          'other-teacher',
          'not-owner',
          Role.teacher,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if adding head teacher as assistant', async () => {
      prismaMock.class.findUnique.mockResolvedValue(mockClass);

      await expect(
        service.addAssistant(
          'class-uuid',
          'teacher-uuid',
          'teacher-uuid',
          Role.teacher,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should add assistant successfully when user exists in same school', async () => {
      prismaMock.class.findUnique.mockResolvedValue(mockClass);
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'assistant-uuid',
        schoolId: 'school-uuid',
      });
      prismaMock.enrollment.findUnique.mockResolvedValue(null);
      prismaMock.enrollment.create.mockResolvedValue({
        id: 'en-assistant',
        roleIn: Role.teacher,
        status: EnrollmentStatus.approved,
      });

      const res = await service.addAssistant(
        'class-uuid',
        'assistant-uuid',
        'teacher-uuid',
        Role.teacher,
      );
      expect(res.message).toBe('Assistant teacher added successfully');
      expect(prismaMock.enrollment.create).toHaveBeenCalled();
    });
  });

  describe('approveMember', () => {
    it('should throw BadRequestException when class capacity is reached', async () => {
      prismaMock.class.findUnique.mockResolvedValue({
        ...mockClass,
        totalStudents: 60,
        maxStudents: 60,
      });
      prismaMock.enrollment.findFirst.mockResolvedValue({
        id: 'en-pending',
        userId: 'student-uuid',
        classId: 'class-uuid',
        roleIn: Role.student,
        status: EnrollmentStatus.pending,
        user: mockStudent,
      });

      await expect(
        service.approveMember('class-uuid', 'en-pending'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should approve a pending member', async () => {
      prismaMock.class.findUnique.mockResolvedValue(mockClass);
      prismaMock.enrollment.findFirst.mockResolvedValue({
        id: 'en-pending',
        userId: 'student-uuid',
        classId: 'class-uuid',
        roleIn: Role.student,
        status: EnrollmentStatus.pending,
        user: mockStudent,
      });
      prismaMock.enrollment.update.mockResolvedValue({
        id: 'en-pending',
        status: EnrollmentStatus.approved,
      });

      const res = await service.approveMember('class-uuid', 'en-pending');
      expect(res.message).toBe('Approve enrollment successful');
      expect(res.data).toEqual(
        expect.objectContaining({ status: EnrollmentStatus.approved }),
      );
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
        service.approveMember('class-uuid', 'en-approved'),
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
        roleIn: Role.student,
        status: EnrollmentStatus.pending,
        user: mockStudent,
      });
      prismaMock.enrollment.update.mockResolvedValue({
        id: 'en-pending',
        status: EnrollmentStatus.rejected,
      });

      const res = await service.rejectMember('class-uuid', 'en-pending');
      expect(res.message).toBe('Reject enrollment successful');
      expect(res.data).toEqual(
        expect.objectContaining({ status: EnrollmentStatus.rejected }),
      );
    });
  });

  describe('reApproveMember', () => {
    it('should re-approve a rejected member', async () => {
      prismaMock.class.findUnique.mockResolvedValue(mockClass);
      prismaMock.enrollment.findFirst.mockResolvedValue({
        id: 'en-rejected',
        userId: 'student-uuid',
        classId: 'class-uuid',
        status: EnrollmentStatus.rejected,
        user: mockStudent,
      });
      prismaMock.enrollment.update.mockResolvedValue({
        id: 'en-rejected',
        status: EnrollmentStatus.approved,
      });

      const res = await service.reApproveMember('class-uuid', 'en-rejected');
      expect(res.message).toBe('Member re-approved successfully');
    });

    it('should throw BadRequestException if member is not currently rejected', async () => {
      prismaMock.class.findUnique.mockResolvedValue(mockClass);
      prismaMock.enrollment.findFirst.mockResolvedValue({
        id: 'en-approved',
        userId: 'student-uuid',
        classId: 'class-uuid',
        status: EnrollmentStatus.approved,
        user: mockStudent,
      });

      await expect(
        service.reApproveMember('class-uuid', 'en-approved'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('banMember & unbanMember', () => {
    it('should ban a student and switch status to suspended', async () => {
      prismaMock.class.findUnique.mockResolvedValue(mockClass);
      prismaMock.enrollment.findFirst.mockResolvedValue({
        id: 'en-student',
        userId: 'student-uuid',
        classId: 'class-uuid',
        roleIn: Role.student,
        status: EnrollmentStatus.approved,
        user: mockStudent,
      });
      prismaMock.enrollment.update.mockResolvedValue({
        id: 'en-student',
        status: EnrollmentStatus.suspended,
      });

      const res = await service.banMember('class-uuid', 'en-student');
      expect(res.message).toBe('Member suspended successfully');
    });

    it('should throw ForbiddenException when attempting to ban head teacher', async () => {
      prismaMock.class.findUnique.mockResolvedValue(mockClass);
      prismaMock.enrollment.findFirst.mockResolvedValue({
        id: 'en-owner',
        userId: 'teacher-uuid',
        classId: 'class-uuid',
        roleIn: Role.teacher,
        user: mockTeacher,
      });

      await expect(service.banMember('class-uuid', 'en-owner')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should unban a suspended member and switch status back to approved', async () => {
      prismaMock.class.findUnique.mockResolvedValue(mockClass);
      prismaMock.enrollment.findFirst.mockResolvedValue({
        id: 'en-suspended',
        userId: 'student-uuid',
        classId: 'class-uuid',
        roleIn: Role.student,
        status: EnrollmentStatus.suspended,
        user: mockStudent,
      });
      prismaMock.enrollment.update.mockResolvedValue({
        id: 'en-suspended',
        status: EnrollmentStatus.approved,
      });

      const res = await service.unbanMember('class-uuid', 'en-suspended');
      expect(res.message).toBe('Member suspension lifted successfully');
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
        service.updateMemberRole('class-uuid', 'en-owner', Role.student),
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
        'class-uuid',
        'en-student',
        Role.teacher,
      );
      expect(res.message).toBe('Update member role successful');
    });
  });
});
