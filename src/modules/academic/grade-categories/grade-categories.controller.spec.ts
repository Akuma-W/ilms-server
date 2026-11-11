import { Test, TestingModule } from '@nestjs/testing';
import { Role } from 'src/generated/prisma/enums';
import type { AuthUser } from 'src/modules/auth/session/interfaces/auth-user.interface';
import { GradeCategoriesController } from './grade-categories.controller';
import { GradeCategoriesService } from './grade-categories.service';

describe('GradeCategoriesController', () => {
  let controller: GradeCategoriesController;

  const serviceMock = {
    getCategories: jest.fn(),
    createCategory: jest.fn(),
    updateCategory: jest.fn(),
    deleteCategory: jest.fn(),
  };

  const mockUser: AuthUser = {
    id: 'user-id',
    jti: 'user@example.com',
    role: Role.teacher,
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  const mockClassId = '11111111-1111-1111-1111-111111111111';
  const mockCategoryId = '22222222-2222-2222-2222-222222222222';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GradeCategoriesController],
      providers: [
        {
          provide: GradeCategoriesService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get<GradeCategoriesController>(
      GradeCategoriesController,
    );
  });

  it('should call getCategories', async () => {
    serviceMock.getCategories.mockResolvedValue([]);
    const result = await controller.getCategories(mockClassId);
    expect(result).toEqual([]);
    expect(serviceMock.getCategories).toHaveBeenCalledWith(mockClassId);
  });

  it('should call createCategory', async () => {
    const dto = { name: 'Chuyên cần', weight: 0.2 };
    serviceMock.createCategory.mockResolvedValue({
      id: mockCategoryId,
      ...dto,
    });

    const result = await controller.createCategory(mockUser, mockClassId, dto);
    expect(result).toHaveProperty('id', mockCategoryId);
    expect(serviceMock.createCategory).toHaveBeenCalledWith(
      mockUser.id,
      mockUser.role,
      mockClassId,
      dto,
    );
  });

  it('should call updateCategory', async () => {
    const dto = { name: 'Giữa kì' };
    serviceMock.updateCategory.mockResolvedValue({
      id: mockCategoryId,
      ...dto,
    });

    const result = await controller.updateCategory(
      mockUser,
      mockClassId,
      mockCategoryId,
      dto,
    );
    expect(result).toHaveProperty('id', mockCategoryId);
    expect(serviceMock.updateCategory).toHaveBeenCalledWith(
      mockUser.id,
      mockUser.role,
      mockClassId,
      mockCategoryId,
      dto,
    );
  });

  it('should call deleteCategory', async () => {
    serviceMock.deleteCategory.mockResolvedValue({
      success: true,
      message: 'Deleted',
    });

    const result = await controller.deleteCategory(
      mockUser,
      mockClassId,
      mockCategoryId,
    );
    expect(result.success).toBe(true);
    expect(serviceMock.deleteCategory).toHaveBeenCalledWith(
      mockUser.id,
      mockUser.role,
      mockClassId,
      mockCategoryId,
    );
  });
});
