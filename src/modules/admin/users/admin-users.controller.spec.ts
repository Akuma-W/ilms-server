import { Test, TestingModule } from '@nestjs/testing';
import { Role, UserStatus } from 'src/generated/prisma/enums';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';

describe('AdminUsersController', () => {
  let controller: AdminUsersController;

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    resetPassword: jest.fn(),
    remove: jest.fn(),
  };

  const mockUser = {
    id: 'user-1',
    email: 'user1@edu.vn',
    fullName: 'Nguyen Van A',
    identityCode: 'SV001',
    role: Role.student,
    status: UserStatus.active,
    avatarUrl: null,
    schoolId: 'school-1',
    school: { id: 'school-1', name: 'UOT', shortname: 'UOT' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminUsersController],
      providers: [{ provide: AdminUsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<AdminUsersController>(AdminUsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll should delegate to service', async () => {
    const paginatedResult = {
      data: [mockUser],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    };
    mockUsersService.findAll.mockResolvedValue(paginatedResult);

    const result = await controller.findAll({ page: 1, limit: 10 });
    expect(result.data.data).toHaveLength(1);
    expect(mockUsersService.findAll).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
    });
  });

  it('create should delegate to service', async () => {
    mockUsersService.create.mockResolvedValue(mockUser);

    const result = await controller.create({
      email: 'user1@edu.vn',
      fullName: 'Nguyen Van A',
      role: Role.student,
      schoolId: 'school-1',
    });
    expect(result.data.id).toBe('user-1');
    expect(mockUsersService.create).toHaveBeenCalled();
  });

  it('update should delegate to service passing current admin id', async () => {
    mockUsersService.update.mockResolvedValue(mockUser);

    const result = await controller.update(
      'user-1',
      { fullName: 'Updated' },
      'admin-id',
    );
    expect(result.data.id).toBe('user-1');
    expect(mockUsersService.update).toHaveBeenCalledWith(
      'user-1',
      { fullName: 'Updated' },
      'admin-id',
    );
  });

  it('resetPassword should delegate to service', async () => {
    mockUsersService.resetPassword.mockResolvedValue({
      success: true,
      message: 'Mật khẩu đã được đặt lại thành công',
      temporaryPassword: 'TempPassword@123',
    });

    const result = await controller.resetPassword('user-1', {});
    expect(result.data.success).toBe(true);
    expect(result.data.temporaryPassword).toBe('TempPassword@123');
    expect(mockUsersService.resetPassword).toHaveBeenCalledWith('user-1', {});
  });

  it('remove should delegate to service passing current admin id', async () => {
    mockUsersService.remove.mockResolvedValue({
      success: true,
      message: 'Tài khoản người dùng đã được vô hiệu hóa thành công',
    });

    const result = await controller.remove('user-1', 'admin-id');
    expect(result.success).toBe(true);
    expect(mockUsersService.remove).toHaveBeenCalledWith('user-1', 'admin-id');
  });
});
