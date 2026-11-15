import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { Role, UserStatus } from 'src/generated/prisma/enums';
import type { AuthUser } from 'src/modules/auth/session/interfaces/auth-user.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';

describe('ProfileController', () => {
  let controller: ProfileController;

  const mockProfileService = {
    getProfile: jest.fn(),
    getProfileClasses: jest.fn(),
    updateProfile: jest.fn(),
    updateAvatar: jest.fn(),
  };

  const mockAuthUser: AuthUser = {
    id: 'user-uuid-1',
    jti: 'user1@example.com',
    role: Role.student,
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  const mockProfileUser = {
    id: 'user-uuid-1',
    email: 'user1@example.com',
    fullName: 'Test User',
    role: Role.student,
    schoolId: 'school-uuid-1',
    avatarUrl: null,
    avatar: null,
    identityCode: 'STU123',
    status: UserStatus.active,
    createdAt: new Date('2026-01-01'),
    school: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        {
          provide: ProfileService,
          useValue: mockProfileService,
        },
      ],
    }).compile();

    controller = module.get<ProfileController>(ProfileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return profile for current user', async () => {
      mockProfileService.getProfile.mockResolvedValue(mockProfileUser);

      const result = await controller.getProfile(mockAuthUser);

      expect(mockProfileService.getProfile).toHaveBeenCalledWith(
        mockAuthUser.id,
      );
      expect(result).toEqual(mockProfileUser);
    });

    it('should propagate NotFoundException if profile is not found', async () => {
      mockProfileService.getProfile.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.getProfile(mockAuthUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getProfileClasses', () => {
    it('should return profile classes matching user role', async () => {
      const mockClasses = [
        {
          id: 'class-1',
          title: 'CS101',
          totalStudents: 30,
          totalTopics: 5,
          totalAssignments: 2,
          totalQuizzes: 1,
        },
      ];
      mockProfileService.getProfileClasses.mockResolvedValue(mockClasses);

      const result = await controller.getProfileClasses(mockAuthUser);

      expect(mockProfileService.getProfileClasses).toHaveBeenCalledWith(
        mockAuthUser.id,
        mockAuthUser.role,
      );
      expect(result).toEqual(mockClasses);
    });
  });

  describe('updateProfile', () => {
    it('should update profile and return updated entity', async () => {
      const dto: UpdateProfileDto = { fullName: 'New Name' };
      const expectedResponse = {
        message: 'Profile updated successfully',
        data: { ...mockProfileUser, fullName: 'New Name' },
      };
      mockProfileService.updateProfile.mockResolvedValue(expectedResponse);

      const result = await controller.updateProfile(mockAuthUser, dto);

      expect(mockProfileService.updateProfile).toHaveBeenCalledWith(
        mockAuthUser.id,
        dto,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should propagate BadRequestException on update failure', async () => {
      mockProfileService.updateProfile.mockRejectedValue(
        new BadRequestException('User not found'),
      );

      await expect(
        controller.updateProfile(mockAuthUser, { fullName: 'New Name' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateAvatar', () => {
    const mockFile = {
      fieldname: 'avatar',
      originalname: 'avatar.png',
      mimetype: 'image/png',
      buffer: Buffer.from('test-image'),
      size: 1024,
    } as Express.Multer.File;

    it('should update avatar and return new avatarUrl', async () => {
      const expectedResponse = {
        message: 'Avatar updated successfully',
        data: { avatarUrl: 'https://storage/avatars/new.png' },
      };
      mockProfileService.updateAvatar.mockResolvedValue(expectedResponse);

      const result = await controller.updateAvatar(mockFile, mockAuthUser);

      expect(mockProfileService.updateAvatar).toHaveBeenCalledWith(
        mockAuthUser.id,
        mockFile,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should throw BadRequestException when no file is uploaded', async () => {
      await expect(
        controller.updateAvatar(
          null as unknown as Express.Multer.File,
          mockAuthUser,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(mockProfileService.updateAvatar).not.toHaveBeenCalled();
    });
  });
});
