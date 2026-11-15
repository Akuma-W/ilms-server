import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Role, UserStatus } from 'src/generated/prisma/enums';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

describe('AdminController', () => {
  let controller: AdminController;

  const mockAdminService = {
    createAdminUser: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    updateAdminUser: jest.fn(),
    delete: jest.fn(),
  };

  const mockUserResult = {
    id: 'user-uuid-1',
    email: 'admin@example.com',
    fullName: 'Admin User',
    role: Role.admin,
    schoolId: 'school-uuid-1',
    avatarUrl: null,
    avatar: null,
    identityCode: null,
    status: UserStatus.active,
    createdAt: new Date('2026-01-01'),
    school: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createAdminUser', () => {
    it('should invoke adminService.createAdminUser and return created user', async () => {
      const dto: CreateUserDto = {
        email: 'new@example.com',
        fullName: 'New User',
        role: Role.student,
        schoolId: 'school-uuid-1',
        status: UserStatus.active,
      };
      mockAdminService.createAdminUser.mockResolvedValue(mockUserResult);

      const result = await controller.createAdminUser(dto);

      expect(mockAdminService.createAdminUser).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockUserResult);
    });
  });

  describe('findAll', () => {
    it('should return all users from adminService.findAll', async () => {
      mockAdminService.findAll.mockResolvedValue([mockUserResult]);

      const result = await controller.findAll();

      expect(mockAdminService.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockUserResult]);
    });
  });

  describe('findOne', () => {
    it('should return user details by id', async () => {
      mockAdminService.findOne.mockResolvedValue(mockUserResult);

      const result = await controller.findOne('user-uuid-1');

      expect(mockAdminService.findOne).toHaveBeenCalledWith('user-uuid-1');
      expect(result).toEqual(mockUserResult);
    });

    it('should propagate NotFoundException when user is not found', async () => {
      mockAdminService.findOne.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateAdminUser', () => {
    it('should update user and return modified user entity', async () => {
      const dto: UpdateUserDto = { fullName: 'Changed Name' };
      mockAdminService.updateAdminUser.mockResolvedValue({
        ...mockUserResult,
        fullName: 'Changed Name',
      });

      const result = await controller.updateAdminUser('user-uuid-1', dto);

      expect(mockAdminService.updateAdminUser).toHaveBeenCalledWith(
        'user-uuid-1',
        dto,
      );
      expect(result.fullName).toBe('Changed Name');
    });

    it('should propagate NotFoundException on invalid id', async () => {
      mockAdminService.updateAdminUser.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        controller.updateAdminUser('invalid-id', { fullName: 'Name' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should deactivate user and return result', async () => {
      mockAdminService.delete.mockResolvedValue({
        ...mockUserResult,
        status: UserStatus.banned,
      });

      const result = await controller.delete('user-uuid-1');

      expect(mockAdminService.delete).toHaveBeenCalledWith('user-uuid-1');
      expect(result.status).toBe(UserStatus.banned);
    });

    it('should propagate NotFoundException when deactivating unknown user', async () => {
      mockAdminService.delete.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.delete('unknown-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
