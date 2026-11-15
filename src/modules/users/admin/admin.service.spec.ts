import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { StorageService } from 'src/infrastructures/storage/storage.service';
import { Role, UserStatus } from 'src/generated/prisma/enums';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

describe('AdminService', () => {
  let service: AdminService;
  const avatarMockUrl = 'https://storage/avatars/sample.png';

  const mockPrismaUser = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  };

  const mockStorageService = {
    getUrl: jest.fn(),
    upload: jest.fn(),
    delete: jest.fn(),
    getAvatarUrl: jest
      .fn()
      .mockImplementation((path: string | null) =>
        Promise.resolve(path ? avatarMockUrl : null),
      ),
  };

  const mockUserRecord = {
    id: 'user-uuid-1',
    email: 'user1@example.com',
    fullName: 'Test User',
    role: Role.student,
    schoolId: 'school-uuid-1',
    avatarUrl: 'avatars/sample.png',
    identityCode: 'STU123',
    status: UserStatus.active,
    createdAt: new Date('2026-01-01'),
    school: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: PrismaService,
          useValue: {
            user: mockPrismaUser,
          },
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAdminUser', () => {
    it('should successfully create a new user record and resolve avatar', async () => {
      const dto: CreateUserDto = {
        email: 'newuser@example.com',
        fullName: 'New User',
        role: Role.student,
        schoolId: 'school-uuid-1',
        status: UserStatus.active,
      };

      mockPrismaUser.create.mockResolvedValue(mockUserRecord);
      mockStorageService.getUrl.mockResolvedValue(avatarMockUrl);

      const result = await service.createAdminUser(dto);

      expect(mockPrismaUser.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: dto,
        }),
      );
      expect(result.avatar).toBe(avatarMockUrl);
      expect(result.id).toBe('user-uuid-1');
    });
  });

  describe('findAll', () => {
    it('should return list of all users with resolved avatars', async () => {
      mockPrismaUser.findMany.mockResolvedValue([mockUserRecord]);
      mockStorageService.getUrl.mockResolvedValue(avatarMockUrl);

      const result = await service.findAll();

      expect(mockPrismaUser.findMany).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
      expect(result[0].avatar).toBe(avatarMockUrl);
    });

    it('should return empty array when no users exist', async () => {
      mockPrismaUser.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return user when found by id', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(mockUserRecord);
      mockStorageService.getUrl.mockResolvedValue(avatarMockUrl);

      const result = await service.findOne('user-uuid-1');

      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-uuid-1' },
        }),
      );
      expect(result.id).toBe('user-uuid-1');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateAdminUser', () => {
    it('should update user record and return updated entity', async () => {
      const updateDto: UpdateUserDto = {
        fullName: 'Updated Name',
      };

      mockPrismaUser.findUnique.mockResolvedValue(mockUserRecord);
      mockPrismaUser.update.mockResolvedValue({
        ...mockUserRecord,
        fullName: 'Updated Name',
      });
      mockStorageService.getUrl.mockResolvedValue(avatarMockUrl);

      const result = await service.updateAdminUser('user-uuid-1', updateDto);

      expect(result.fullName).toBe('Updated Name');
      expect(mockPrismaUser.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-uuid-1' },
          data: updateDto,
        }),
      );
    });

    it('should throw NotFoundException when updating non-existent user', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      await expect(
        service.updateAdminUser('non-existent-id', { fullName: 'Name' }),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaUser.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should soft delete user by setting status to banned', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(mockUserRecord);
      mockPrismaUser.update.mockResolvedValue({
        ...mockUserRecord,
        status: UserStatus.banned,
      });
      mockStorageService.getUrl.mockResolvedValue(avatarMockUrl);

      const result = await service.delete('user-uuid-1');

      expect(mockPrismaUser.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-uuid-1' },
          data: { status: UserStatus.banned },
        }),
      );
      expect(result.status).toBe(UserStatus.banned);
    });

    it('should throw NotFoundException when deleting non-existent user', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      await expect(service.delete('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaUser.update).not.toHaveBeenCalled();
    });
  });
});
