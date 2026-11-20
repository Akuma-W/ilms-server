import { Test, TestingModule } from '@nestjs/testing';
import { CalculationsController } from './calculations.controller';
import { CalculationsService } from './calculations.service';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';

describe('CalculationsController', () => {
  let controller: CalculationsController;

  const serviceMock = {
    batchUpdateGrades: jest.fn(),
    calculateAttendance: jest.fn(),
    syncGrades: jest.fn(),
    overrideGrade: jest.fn(),
  };

  const prismaMock = {};

  const mockClassId = '11111111-1111-1111-1111-111111111111';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalculationsController],
      providers: [
        {
          provide: CalculationsService,
          useValue: serviceMock,
        },
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    controller = module.get<CalculationsController>(CalculationsController);
  });

  it('should call batchUpdateGrades', async () => {
    const dto = { updates: [] };
    serviceMock.batchUpdateGrades.mockResolvedValue({
      success: true,
      message: 'Batch updated',
      count: 0,
    });

    const result = await controller.batchUpdateGrades(mockClassId, dto);
    expect(result.success).toBe(true);
    expect(serviceMock.batchUpdateGrades).toHaveBeenCalledWith(
      mockClassId,
      dto,
    );
  });

  it('should call calculateAttendance', async () => {
    const dto = { materialWeight: 0.5, meetingWeight: 0.5 };
    serviceMock.calculateAttendance.mockResolvedValue({
      categoryId: 'cat-1',
      categoryName: 'Attendance',
      updatedCount: 10,
    });

    const result = await controller.calculateAttendance(mockClassId, dto);
    expect(result.updatedCount).toBe(10);
    expect(serviceMock.calculateAttendance).toHaveBeenCalledWith(
      mockClassId,
      dto,
    );
  });

  it('should call syncGrades', async () => {
    const dto = { categoryId: 'cat-1' };
    serviceMock.syncGrades.mockResolvedValue({
      syncedCategories: 1,
      totalGradesUpdated: 10,
    });

    const result = await controller.syncGrades(mockClassId, dto);
    expect(result.syncedCategories).toBe(1);
    expect(serviceMock.syncGrades).toHaveBeenCalledWith(mockClassId, dto);
  });

  it('should call overrideGrade', async () => {
    const dto = {
      studentId: 'student-1',
      categoryId: 'cat-1',
      score: 9.0,
      reason: 'Good effort',
    };
    serviceMock.overrideGrade.mockResolvedValue({
      id: 'grade-1',
      score: 9.0,
    });

    const result = await controller.overrideGrade(mockClassId, dto);
    expect(result.score).toBe(9.0);
    expect(serviceMock.overrideGrade).toHaveBeenCalledWith(mockClassId, dto);
  });
});
