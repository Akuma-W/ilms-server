import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { Role } from 'src/generated/prisma/enums';
import type { AuthUser } from 'src/modules/auth/session/interfaces/auth-user.interface';
import { SubjectsService } from './subjects.service';

describe('SubjectsService', () => {
  let service: SubjectsService;

  const mockPrisma = {
    school: {
      findUnique: jest.fn(),
    },
    subject: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    class: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const adminUser: AuthUser = {
    id: 'admin-uuid',
    jti: 'jti-1',
    role: Role.admin,
    exp: 999999999,
  };

  const teacherUser: AuthUser = {
    id: 'teacher-uuid',
    jti: 'jti-2',
    role: Role.teacher,
    exp: 999999999,
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubjectsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<SubjectsService>(SubjectsService);
  });

  describe('create', () => {
    it('should throw NotFoundException if school does not exist', async () => {
      mockPrisma.school.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          schoolId: 'non-existent',
          code: 'IT001',
          name: 'Intro to CS',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if subject code exists in school', async () => {
      mockPrisma.school.findUnique.mockResolvedValue({ id: 'school-1' });
      mockPrisma.subject.findUnique.mockResolvedValue({ id: 'existing-id' });

      await expect(
        service.create({
          schoolId: 'school-1',
          code: 'IT001',
          name: 'Intro to CS',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create and return subject entity on valid input', async () => {
      mockPrisma.school.findUnique.mockResolvedValue({ id: 'school-1' });
      mockPrisma.subject.findUnique.mockResolvedValue(null);
      mockPrisma.subject.create.mockResolvedValue({
        id: 'subject-1',
        schoolId: 'school-1',
        code: 'IT001',
        name: 'Intro to CS',
        credits: 3,
        isActive: true,
      });

      const result = await service.create({
        schoolId: 'school-1',
        code: 'IT001',
        name: 'Intro to CS',
      });

      expect(result.id).toBe('subject-1');
      expect(mockPrisma.subject.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should query all subjects for admin without schoolId', async () => {
      mockPrisma.subject.count.mockResolvedValue(1);
      mockPrisma.subject.findMany.mockResolvedValue([
        { id: 'sub-1', code: 'IT001', name: 'Intro' },
      ]);

      const result = await service.findAll(adminUser, { page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should restrict teacher to their own schoolId', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ schoolId: 'school-uit' });
      mockPrisma.subject.count.mockResolvedValue(1);
      mockPrisma.subject.findMany.mockResolvedValue([
        { id: 'sub-1', schoolId: 'school-uit' },
      ]);

      const result = await service.findAll(teacherUser, {});
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: teacherUser.id },
        select: { schoolId: true },
      });
      expect(result.data).toHaveLength(1);
    });

    it('should return empty list if teacher has no schoolId', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ schoolId: null });

      const result = await service.findAll(teacherUser, {});
      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if subject not found', async () => {
      mockPrisma.subject.findUnique.mockResolvedValue(null);

      await expect(service.findOne('sub-404', adminUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if teacher belongs to different school', async () => {
      mockPrisma.subject.findUnique.mockResolvedValue({
        id: 'sub-1',
        schoolId: 'school-a',
      });
      mockPrisma.user.findUnique.mockResolvedValue({ schoolId: 'school-b' });

      await expect(service.findOne('sub-1', teacherUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return subject if authorized', async () => {
      const subject = { id: 'sub-1', schoolId: 'school-a' };
      mockPrisma.subject.findUnique.mockResolvedValue(subject);
      mockPrisma.user.findUnique.mockResolvedValue({ schoolId: 'school-a' });

      const result = await service.findOne('sub-1', teacherUser);
      expect(result).toEqual(subject);
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if subject does not exist', async () => {
      mockPrisma.subject.findUnique.mockResolvedValue(null);

      await expect(
        service.update('sub-404', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if new code collides with another subject', async () => {
      mockPrisma.subject.findUnique
        .mockResolvedValueOnce({
          id: 'sub-1',
          schoolId: 'school-1',
          code: 'IT001',
        })
        .mockResolvedValueOnce({ id: 'sub-2' });

      await expect(service.update('sub-1', { code: 'IT002' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('should update successfully when valid', async () => {
      mockPrisma.subject.findUnique
        .mockResolvedValueOnce({
          id: 'sub-1',
          schoolId: 'school-1',
          code: 'IT001',
        })
        .mockResolvedValueOnce(null);
      mockPrisma.subject.update.mockResolvedValue({
        id: 'sub-1',
        name: 'Updated Name',
      });

      const result = await service.update('sub-1', { name: 'Updated Name' });
      expect(result.name).toBe('Updated Name');
    });
  });

  describe('remove', () => {
    it('should throw BadRequestException if subject has linked classes', async () => {
      mockPrisma.subject.findUnique.mockResolvedValue({ id: 'sub-1' });
      mockPrisma.class.count.mockResolvedValue(2);

      await expect(service.remove('sub-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should delete subject if no linked classes', async () => {
      mockPrisma.subject.findUnique.mockResolvedValue({ id: 'sub-1' });
      mockPrisma.class.count.mockResolvedValue(0);
      mockPrisma.subject.delete.mockResolvedValue({ id: 'sub-1' });

      const result = await service.remove('sub-1');
      expect(result.message).toBe('Subject deleted successfully');
    });
  });

  describe('findSubjectClasses', () => {
    it('should return list of classes for valid subject', async () => {
      mockPrisma.subject.findUnique.mockResolvedValue({
        id: 'sub-1',
        schoolId: 'school-1',
      });
      mockPrisma.class.findMany.mockResolvedValue([
        {
          id: 'class-1',
          title: 'Class 1',
          subject: 'CS',
          teacher: { id: 'teacher-1', fullName: 'Teacher A', avatarUrl: null },
        },
      ]);

      const result = await service.findSubjectClasses('sub-1', adminUser);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Class 1');
    });
  });
});
