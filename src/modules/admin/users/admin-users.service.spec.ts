import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { StorageService } from 'src/infrastructures/storage/storage.service';
import { NotificationFacade } from 'src/infrastructures/notification/notification.facade';
import { Role, UserStatus } from 'src/generated/prisma/enums';
import { AdminUsersService } from './admin-users.service';

describe('AdminUsersService', () => {
  let service: AdminUsersService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockStorageService = {
    getAvatarUrl: jest
      .fn()
      .mockImplementation((path) =>
        Promise.resolve(path ? `presigned-${path}` : null),
      ),
  };

  const mockNotificationFacade = {
    sendEmailTemplate: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminUsersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: StorageService, useValue: mockStorageService },
        { provide: NotificationFacade, useValue: mockNotificationFacade },
      ],
    }).compile();

    service = module.get<AdminUsersService>(AdminUsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw ConflictException if email exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u-1' });

      await expect(
        service.create({
          email: 'dup@edu.vn',
          fullName: 'Tên',
          role: Role.student,
          schoolId: 'sch-1',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create user with hashed password and return entity', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'u-new',
        email: 'user@edu.vn',
        fullName: 'Nguyễn Văn A',
        identityCode: 'SV01',
        role: Role.student,
        status: UserStatus.active,
        avatarUrl: null,
        schoolId: 'sch-1',
        school: { id: 'sch-1', name: 'ĐH A', shortname: 'DHA' },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create({
        email: 'user@edu.vn',
        fullName: 'Nguyễn Văn A',
        role: Role.student,
        schoolId: 'sch-1',
        identityCode: 'SV01',
      });

      expect(result.id).toBe('u-new');
      expect(result.email).toBe('user@edu.vn');
      expect(result.temporaryPassword).toBeDefined();
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should throw BadRequestException if administrator tries to lock own account', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@edu.vn',
        fullName: 'Admin',
        role: Role.admin,
        status: UserStatus.active,
        avatarUrl: null,
        schoolId: 'sch-1',
        school: { id: 'sch-1', name: 'ĐH A', shortname: 'DHA' },
      });

      await expect(
        service.update('admin-1', { status: UserStatus.locked }, 'admin-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if administrator tries to demote own account', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@edu.vn',
        fullName: 'Admin',
        role: Role.admin,
        status: UserStatus.active,
        avatarUrl: null,
        schoolId: 'sch-1',
        school: { id: 'sch-1', name: 'ĐH A', shortname: 'DHA' },
      });

      await expect(
        service.update('admin-1', { role: Role.student }, 'admin-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update other user successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-2',
        email: 'user2@edu.vn',
        fullName: 'User 2',
        role: Role.student,
        status: UserStatus.active,
        avatarUrl: null,
        schoolId: 'sch-1',
        school: { id: 'sch-1', name: 'ĐH A', shortname: 'DHA' },
      });
      mockPrismaService.user.update.mockResolvedValue({
        id: 'user-2',
        email: 'user2@edu.vn',
        fullName: 'User 2 Đã đổi tên',
        identityCode: 'SV02',
        role: Role.student,
        status: UserStatus.active,
        avatarUrl: null,
        schoolId: 'sch-1',
        school: { id: 'sch-1', name: 'ĐH A', shortname: 'DHA' },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.update(
        'user-2',
        { fullName: 'User 2 Đã đổi tên' },
        'admin-1',
      );

      expect(result.fullName).toBe('User 2 Đã đổi tên');
    });

    it('should reset statusReason to null when user is activated', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-2',
        email: 'user2@edu.vn',
        fullName: 'User 2',
        role: Role.student,
        status: UserStatus.locked,
        statusReason: 'Lý do cũ',
        avatarUrl: null,
        schoolId: 'sch-1',
        school: { id: 'sch-1', name: 'ĐH A', shortname: 'DHA' },
      });
      mockPrismaService.user.update.mockResolvedValue({
        id: 'user-2',
        email: 'user2@edu.vn',
        fullName: 'User 2',
        role: Role.student,
        status: UserStatus.active,
        statusReason: null,
        avatarUrl: null,
        schoolId: 'sch-1',
        school: { id: 'sch-1', name: 'ĐH A', shortname: 'DHA' },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.update('user-2', { status: UserStatus.active }, 'admin-1');

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-2' },
        data: {
          status: UserStatus.active,
          statusReason: null,
        },
        include: {
          school: {
            select: { id: true, name: true, shortname: true },
          },
        },
      });
    });
  });

  describe('resetPassword', () => {
    it('should reset password, send email notification and return temporary credential', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'u-1',
        email: 'u1@edu.vn',
        avatarUrl: null,
        school: { id: 'sch-1', name: 'ĐH A', shortname: 'DHA' },
      });
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.resetPassword('u-1', {});

      expect(result.success).toBe(true);
      expect(result.temporaryPassword).toBeDefined();
      expect(result.temporaryPassword.length).toBeGreaterThanOrEqual(8);
      expect(mockPrismaService.user.update).toHaveBeenCalled();
      expect(mockNotificationFacade.sendEmailTemplate).toHaveBeenCalled();
      const calls = mockNotificationFacade.sendEmailTemplate.mock
        .calls as unknown as [string, { subject: string; content: string }][];
      expect(calls[0][0]).toBe('u1@edu.vn');
      expect(calls[0][1].content).toContain(result.temporaryPassword);
    });
  });

  describe('remove', () => {
    it('should throw BadRequestException if administrator tries to delete own account', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'admin-1',
        avatarUrl: null,
        school: { id: 'sch-1', name: 'ĐH A', shortname: 'DHA' },
      });

      await expect(service.remove('admin-1', 'admin-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should soft delete user account by setting status to banned', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-2',
        avatarUrl: null,
        school: { id: 'sch-1', name: 'ĐH A', shortname: 'DHA' },
      });
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.remove('user-2', 'admin-1');

      expect(result.success).toBe(true);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-2' },
        data: { status: UserStatus.banned },
      });
    });
  });
});
