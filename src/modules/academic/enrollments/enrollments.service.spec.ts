import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EnrollmentsService } from './enrollments.service';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { EnrollmentStatus, Role } from 'src/generated/prisma/enums';

describe('EnrollmentsService', () => {
  let service: EnrollmentsService;
  let prismaMock: {
    class: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
    };
    user: {
      findUnique: jest.Mock;
    };
    enrollment: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  const mockUser = {
    id: 'user-uuid',
    schoolId: 'school-uuid',
    fullName: 'John Doe',
    email: 'john@example.com',
    role: Role.student,
  };

  const mockPublicClass = {
    id: 'class-uuid',
    title: 'Public Class',
    schoolId: 'school-uuid',
    isPrivate: false,
    teacherId: 'teacher-uuid',
  };

  const mockPrivateClass = {
    id: 'private-class-uuid',
    title: 'Private Class',
    schoolId: 'school-uuid',
    isPrivate: true,
    teacherId: 'teacher-uuid',
  };

  beforeEach(async () => {
    prismaMock = {
      class: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      enrollment: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrollmentsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<EnrollmentsService>(EnrollmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create (join class)', () => {
    it('should throw NotFoundException if class not found', async () => {
      prismaMock.class.findUnique.mockResolvedValue(null);
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.create({ classId: 'non-existent' }, 'user-uuid'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if user not found', async () => {
      prismaMock.class.findUnique.mockResolvedValue(mockPublicClass);
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ classId: 'class-uuid' }, 'user-uuid'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user and class belong to different schools', async () => {
      prismaMock.class.findUnique.mockResolvedValue(mockPublicClass);
      prismaMock.user.findUnique.mockResolvedValue({
        ...mockUser,
        schoolId: 'different-school',
      });

      await expect(
        service.create({ classId: 'class-uuid' }, 'user-uuid'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if already enrolled and approved', async () => {
      prismaMock.class.findUnique.mockResolvedValue(mockPublicClass);
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.enrollment.findUnique.mockResolvedValue({
        id: 'existing-id',
        status: EnrollmentStatus.approved,
      });

      await expect(
        service.create({ classId: 'class-uuid' }, 'user-uuid'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should auto-approve when joining a public class', async () => {
      prismaMock.class.findUnique.mockResolvedValue(mockPublicClass);
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.enrollment.findUnique.mockResolvedValue(null);
      prismaMock.enrollment.create.mockResolvedValue({
        id: 'new-en-uuid',
        classId: 'class-uuid',
        userId: 'user-uuid',
        status: EnrollmentStatus.approved,
      });

      const result = await service.create(
        { classId: 'class-uuid' },
        'user-uuid',
      );
      expect(result.status).toBe(EnrollmentStatus.approved);
      expect(prismaMock.enrollment.create).toHaveBeenCalled();
    });

    it('should set status to pending when joining a private class', async () => {
      prismaMock.class.findUnique.mockResolvedValue(mockPrivateClass);
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.enrollment.findUnique.mockResolvedValue(null);
      prismaMock.enrollment.create.mockResolvedValue({
        id: 'new-en-uuid',
        classId: 'private-class-uuid',
        userId: 'user-uuid',
        status: EnrollmentStatus.pending,
      });

      const result = await service.create(
        { classId: 'private-class-uuid' },
        'user-uuid',
      );
      expect(result.status).toBe(EnrollmentStatus.pending);
    });

    it('should allow re-applying if previously rejected', async () => {
      prismaMock.class.findUnique.mockResolvedValue(mockPublicClass);
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.enrollment.findUnique.mockResolvedValue({
        id: 'existing-rejected-id',
        status: EnrollmentStatus.rejected,
      });
      prismaMock.enrollment.update.mockResolvedValue({
        id: 'existing-rejected-id',
        status: EnrollmentStatus.approved,
      });

      const result = await service.create(
        { classId: 'class-uuid' },
        'user-uuid',
      );
      expect(result.status).toBe(EnrollmentStatus.approved);
      expect(prismaMock.enrollment.update).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return accurate total and totalPages from database count', async () => {
      prismaMock.enrollment.findMany.mockResolvedValue([
        {
          id: 'en-1',
          userId: 'user-uuid',
          classId: 'class-1',
          roleIn: Role.student,
          isStarred: false,
          status: EnrollmentStatus.approved,
          joinedAt: new Date(),
          class: { id: 'class-1', title: 'Course 1' },
        },
      ]);
      prismaMock.enrollment.count.mockResolvedValue(25);

      const result = await service.findAll('user-uuid', {
        page: 1,
        limit: 10,
      });

      expect(result.meta.total).toBe(25);
      expect(result.meta.totalPages).toBe(3);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('toggleStar', () => {
    it('should throw ForbiddenException if enrollment not owned by user', async () => {
      prismaMock.enrollment.findUnique.mockResolvedValue({
        id: 'en-1',
        userId: 'other-user',
        status: EnrollmentStatus.approved,
      });

      await expect(service.toggleStar('user-uuid', 'en-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if enrollment is not approved', async () => {
      prismaMock.enrollment.findUnique.mockResolvedValue({
        id: 'en-1',
        userId: 'user-uuid',
        status: EnrollmentStatus.pending,
      });

      await expect(service.toggleStar('user-uuid', 'en-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should toggle star state if valid', async () => {
      prismaMock.enrollment.findUnique.mockResolvedValue({
        id: 'en-1',
        userId: 'user-uuid',
        status: EnrollmentStatus.approved,
        isStarred: false,
      });
      prismaMock.enrollment.update.mockResolvedValue({
        id: 'en-1',
        isStarred: true,
      });

      const result = await service.toggleStar('user-uuid', 'en-1');
      expect(result.isStarred).toBe(true);
    });
  });

  describe('leaveClass', () => {
    it('should throw NotFoundException if enrollment not found', async () => {
      prismaMock.enrollment.findUnique.mockResolvedValue(null);

      await expect(
        service.leaveClass('user-uuid', 'class-uuid'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if the last teacher leaves', async () => {
      prismaMock.enrollment.findUnique.mockResolvedValue({
        id: 'en-1',
        roleIn: Role.teacher,
      });
      prismaMock.enrollment.count.mockResolvedValue(1);

      await expect(
        service.leaveClass('user-uuid', 'class-uuid'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should delete enrollment when student leaves class', async () => {
      prismaMock.enrollment.findUnique.mockResolvedValue({
        id: 'en-1',
        roleIn: Role.student,
      });
      prismaMock.enrollment.delete.mockResolvedValue({});

      const result = await service.leaveClass('user-uuid', 'class-uuid');
      expect(result.message).toBe('Leave class successful');
    });
  });
});
