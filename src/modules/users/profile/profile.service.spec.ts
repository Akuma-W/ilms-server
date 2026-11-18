import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { StorageService } from 'src/infrastructures/storage/storage.service';
import { LoggerService } from 'src/logger/logger.service';
import { Role, UserStatus } from 'src/generated/prisma/enums';
import { UpdateProfileDto } from './dto/update-profile.dto';

describe('ProfileService', () => {
  let service: ProfileService;
  const avatarMockUrl = 'https://storage/avatars/sample.png';

  const mockPrismaUser = {
    findUnique: jest.fn(),
    update: jest.fn(),
  };

  const mockPrismaEnrollment = {
    findMany: jest.fn(),
  };

  const mockPrismaClass = {
    findMany: jest.fn(),
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
    replaceFile: jest.fn().mockResolvedValue('avatars/new-avatar.png'),
  };

  const mockLoggerService = {
    error: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
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
        ProfileService,
        {
          provide: PrismaService,
          useValue: {
            user: mockPrismaUser,
            enrollment: mockPrismaEnrollment,
            class: mockPrismaClass,
          },
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile with resolved avatar URL', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(mockUserRecord);
      mockStorageService.getUrl.mockResolvedValue(avatarMockUrl);

      const result = await service.getProfile('user-uuid-1');

      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-uuid-1' },
        }),
      );
      expect(result.avatarUrl).toBe(avatarMockUrl);
      expect(result.id).toBe('user-uuid-1');
    });

    it('should throw NotFoundException if user is not found', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getProfileClasses', () => {
    it('should return mapped profile classes for student role', async () => {
      const mockEnrollments = [
        {
          id: 'enrollment-1',
          status: 'approved',
          roleIn: 'student',
          joinedAt: new Date('2026-01-10'),
          class: {
            id: 'class-1',
            courseCode: 'CS101',
            title: 'Computer Science',
            description: 'Intro to CS',
            subject: 'IT',
            semester: 'HK1',
            createdAt: new Date('2026-01-01'),
            teacher: {
              id: 'teacher-1',
              fullName: 'Teacher Name',
              email: 'teacher@example.com',
              avatarUrl: null,
            },
            _count: {
              enrollments: 25,
              topics: 4,
              assignments: 2,
              quizPublications: 1,
            },
          },
        },
      ];

      mockPrismaEnrollment.findMany.mockResolvedValue(mockEnrollments);

      const result = await service.getProfileClasses(
        'user-uuid-1',
        Role.student,
      );

      expect(mockPrismaEnrollment.findMany).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('class-1');
      expect(result[0].totalStudents).toBe(25);
      expect(result[0].totalTopics).toBe(4);
      expect(result[0].enrollment?.id).toBe('enrollment-1');
    });

    it('should return mapped profile classes for teacher role', async () => {
      const mockTeacherClasses = [
        {
          id: 'class-2',
          courseCode: 'MATH101',
          title: 'Calculus',
          description: 'Calculus I',
          subject: 'Math',
          semester: 'HK1',
          createdAt: new Date('2026-01-01'),
          teacher: {
            id: 'user-uuid-1',
            fullName: 'Teacher Name',
            email: 'teacher@example.com',
            avatarUrl: null,
          },
          _count: {
            enrollments: 40,
            topics: 6,
            assignments: 5,
            quizPublications: 3,
          },
        },
      ];

      mockPrismaClass.findMany.mockResolvedValue(mockTeacherClasses);

      const result = await service.getProfileClasses(
        'user-uuid-1',
        Role.teacher,
      );

      expect(mockPrismaClass.findMany).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('class-2');
      expect(result[0].totalStudents).toBe(40);
      expect(result[0].enrollment).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const dto: UpdateProfileDto = {
        fullName: 'New Name',
        identityCode: 'NEW123',
      };

      mockPrismaUser.findUnique.mockResolvedValue(mockUserRecord);
      mockPrismaUser.update.mockResolvedValue({
        ...mockUserRecord,
        fullName: 'New Name',
        identityCode: 'NEW123',
      });
      mockStorageService.getUrl.mockResolvedValue(avatarMockUrl);

      const result = await service.updateProfile('user-uuid-1', dto);

      expect(result.message).toBe('Profile updated successfully');
      expect(result.data.fullName).toBe('New Name');
      expect(result.data.identityCode).toBe('NEW123');
    });

    it('should throw BadRequestException when updating non-existent user profile', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      await expect(
        service.updateProfile('non-existent-id', { fullName: 'Name' }),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrismaUser.update).not.toHaveBeenCalled();
    });
  });

  describe('updateAvatar', () => {
    const mockFile = {
      fieldname: 'avatar',
      originalname: 'avatar.png',
      encoding: '7bit',
      mimetype: 'image/png',
      buffer: Buffer.from('fake-image-data'),
      size: 1024,
    } as Express.Multer.File;

    it('should upload new avatar, delete old avatar and update record', async () => {
      const newAvatarUrl = 'https://storage/avatars/new-avatar.png';
      mockPrismaUser.findUnique.mockResolvedValue({
        ...mockUserRecord,
        avatarUrl: 'avatars/old-avatar.png',
      });
      mockStorageService.upload.mockResolvedValue('avatars/new-avatar.png');
      mockStorageService.delete.mockResolvedValue(undefined);
      mockStorageService.getUrl.mockResolvedValue(newAvatarUrl);

      const result = await service.updateAvatar('user-uuid-1', mockFile);

      expect(mockStorageService.replaceFile).toHaveBeenCalledWith(
        'avatars/old-avatar.png',
        mockFile,
        expect.any(String),
      );
      expect(mockPrismaUser.update).toHaveBeenCalledWith({
        where: { id: 'user-uuid-1' },
        data: { avatarUrl: 'avatars/new-avatar.png' },
      });
      expect(result.data.avatarUrl).toBe(newAvatarUrl);
    });

    it('should throw BadRequestException if user does not exist when updating avatar', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      await expect(
        service.updateAvatar('non-existent-id', mockFile),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
