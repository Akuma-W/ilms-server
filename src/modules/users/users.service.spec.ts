import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { StorageService } from 'src/infrastructures/storage/storage.service';
import { Role, UserStatus } from 'src/generated/prisma/enums';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateGoogleUserDto } from './dto/create-google-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  const avatarMockUrl = 'https://storage/avatars/sample.png';

  const mockPrismaUser = {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  };

  const mockStorageService = {
    getUrl: jest.fn(),
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
        UsersService,
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

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRegisteredUser', () => {
    it('should create a registered user record and resolve avatar', async () => {
      const dto: CreateUserDto = {
        email: 'reg@example.com',
        fullName: 'Registered User',
        role: Role.student,
        schoolId: 'school-uuid-1',
        status: UserStatus.active,
      };

      mockPrismaUser.create.mockResolvedValue(mockUserRecord);
      mockStorageService.getUrl.mockResolvedValue(avatarMockUrl);

      const result = await service.createRegisteredUser(dto);

      expect(mockPrismaUser.create).toHaveBeenCalledTimes(1);
      expect(result.avatar).toBe(avatarMockUrl);
      expect(result.id).toBe('user-uuid-1');
    });
  });

  describe('createGoogleUser', () => {
    it('should create a google oauth user record', async () => {
      const dto: CreateGoogleUserDto = {
        email: 'google@example.com',
        fullName: 'Google User',
        role: Role.student,
        schoolId: 'school-uuid-1',
        googleId: 'google-sub-123',
        status: UserStatus.active,
      };

      mockPrismaUser.create.mockResolvedValue({
        ...mockUserRecord,
        email: 'google@example.com',
      });
      mockStorageService.getUrl.mockResolvedValue(avatarMockUrl);

      const result = await service.createGoogleUser(dto);

      expect(mockPrismaUser.create).toHaveBeenCalled();
      expect(result.email).toBe('google@example.com');
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

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByEmail', () => {
    it('should return user with password and googleId when found by email', async () => {
      mockPrismaUser.findUnique.mockResolvedValue({
        ...mockUserRecord,
        password: 'hashed-password',
        googleId: null,
      });
      mockStorageService.getUrl.mockResolvedValue(avatarMockUrl);

      const result = await service.findByEmail('user1@example.com');

      expect(result).not.toBeNull();
      expect(result?.password).toBe('hashed-password');
      expect(result?.avatar).toBe(avatarMockUrl);
    });

    it('should return null when user not found by email', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail('unknown@example.com');

      expect(result).toBeNull();
    });
  });

  describe('updatePassword', () => {
    it('should update password hash for existing user', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(mockUserRecord);
      mockPrismaUser.update.mockResolvedValue(mockUserRecord);

      await service.updatePassword('user-uuid-1', 'new-hashed-password');

      expect(mockPrismaUser.update).toHaveBeenCalledWith({
        where: { id: 'user-uuid-1' },
        data: { password: 'new-hashed-password' },
      });
    });

    it('should throw NotFoundException if user not found when updating password', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      await expect(
        service.updatePassword('non-existent', 'hash'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateGoogleAccount', () => {
    it('should update linked google credentials', async () => {
      mockPrismaUser.update.mockResolvedValue(mockUserRecord);

      await service.updateGoogleAccount('user-uuid-1', {
        googleId: 'new-google-id',
      });

      expect(mockPrismaUser.update).toHaveBeenCalledWith({
        where: { id: 'user-uuid-1' },
        data: { googleId: 'new-google-id' },
      });
    });
  });

  describe('updateRegisteredUser', () => {
    it('should update registered user attributes and resolve avatar', async () => {
      mockPrismaUser.update.mockResolvedValue({
        ...mockUserRecord,
        fullName: 'Updated Reg User',
      });
      mockStorageService.getUrl.mockResolvedValue(avatarMockUrl);

      const result = await service.updateRegisteredUser('user-uuid-1', {
        fullName: 'Updated Reg User',
      });

      expect(result.fullName).toBe('Updated Reg User');
      expect(result.avatar).toBe(avatarMockUrl);
    });
  });
});
