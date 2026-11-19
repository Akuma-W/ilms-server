import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';

describe('CategoriesController', () => {
  let controller: CategoriesController;

  const serviceMock = {
    getCategories: jest.fn(),
    createCategory: jest.fn(),
    updateCategory: jest.fn(),
    deleteCategory: jest.fn(),
  };

  const prismaMock = {};

  const mockClassId = '11111111-1111-1111-1111-111111111111';
  const mockCategoryId = '22222222-2222-2222-2222-222222222222';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: serviceMock,
        },
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
  });

  it('should call getCategories', async () => {
    serviceMock.getCategories.mockResolvedValue([]);
    const result = await controller.getCategories(mockClassId);
    expect(result).toEqual([]);
    expect(serviceMock.getCategories).toHaveBeenCalledWith(mockClassId);
  });

  it('should call createCategory', async () => {
    const dto = { name: 'Attendance', weight: 0.2 };
    serviceMock.createCategory.mockResolvedValue({
      id: mockCategoryId,
      ...dto,
    });

    const result = await controller.createCategory(mockClassId, dto);
    expect(result).toHaveProperty('id', mockCategoryId);
    expect(serviceMock.createCategory).toHaveBeenCalledWith(mockClassId, dto);
  });

  it('should call updateCategory', async () => {
    const dto = { name: 'Midterm' };
    serviceMock.updateCategory.mockResolvedValue({
      id: mockCategoryId,
      ...dto,
    });

    const result = await controller.updateCategory(
      mockClassId,
      mockCategoryId,
      dto,
    );
    expect(result).toHaveProperty('id', mockCategoryId);
    expect(serviceMock.updateCategory).toHaveBeenCalledWith(
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

    const result = await controller.deleteCategory(mockClassId, mockCategoryId);
    expect(result.success).toBe(true);
    expect(serviceMock.deleteCategory).toHaveBeenCalledWith(
      mockClassId,
      mockCategoryId,
    );
  });
});
