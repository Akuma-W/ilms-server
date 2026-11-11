import { Test, TestingModule } from '@nestjs/testing';
import { Role } from 'src/generated/prisma/enums';
import type { AuthUser } from 'src/modules/auth/session/interfaces/auth-user.interface';
import { GradesController } from './grades.controller';
import { GradesService } from './grades.service';

describe('GradesController', () => {
  let controller: GradesController;

  const serviceMock = {
    getGradeMatrix: jest.fn(),
    getMyGradeRecord: jest.fn(),
    batchUpdateGrades: jest.fn(),
  };

  const mockUser: AuthUser = {
    id: 'user-id',
    jti: 'user@example.com',
    role: Role.teacher,
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  const mockClassId = '11111111-1111-1111-1111-111111111111';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GradesController],
      providers: [
        {
          provide: GradesService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get<GradesController>(GradesController);
  });

  it('should call getGradeMatrix', async () => {
    serviceMock.getGradeMatrix.mockResolvedValue({
      totalStudents: 0,
      rows: [],
    });

    const result = await controller.getGradeMatrix(mockUser, mockClassId);
    expect(result).toHaveProperty('totalStudents', 0);
    expect(serviceMock.getGradeMatrix).toHaveBeenCalledWith(
      mockUser.id,
      mockUser.role,
      mockClassId,
    );
  });

  it('should call getMyGradeRecord', async () => {
    serviceMock.getMyGradeRecord.mockResolvedValue({ studentId: mockUser.id });

    const result = await controller.getMyGradeRecord(
      mockUser,
      mockClassId,
      undefined,
    );
    expect(result).toHaveProperty('studentId', mockUser.id);
    expect(serviceMock.getMyGradeRecord).toHaveBeenCalledWith(
      mockUser.id,
      mockUser.role,
      mockClassId,
      undefined,
    );
  });

  it('should call batchUpdateGrades', async () => {
    const dto = {
      updates: [{ studentId: 'stu-1', categoryId: 'cat-1', score: 9 }],
    };
    serviceMock.batchUpdateGrades.mockResolvedValue({
      success: true,
      count: 1,
    });

    const result = await controller.batchUpdateGrades(
      mockUser,
      mockClassId,
      dto,
    );
    expect(result).toHaveProperty('count', 1);
    expect(serviceMock.batchUpdateGrades).toHaveBeenCalledWith(
      mockUser.id,
      mockUser.role,
      mockClassId,
      dto,
    );
  });
});
