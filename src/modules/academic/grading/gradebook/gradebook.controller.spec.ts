import { Test, TestingModule } from '@nestjs/testing';
import { Role } from 'src/generated/prisma/enums';
import type { AuthUser } from 'src/modules/auth/session/interfaces/auth-user.interface';
import { GradebookController } from './gradebook.controller';
import { GradebookService } from './gradebook.service';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';

describe('GradebookController', () => {
  let controller: GradebookController;

  const serviceMock = {
    getGradeMatrix: jest.fn(),
    getMyGradeRecord: jest.fn(),
    getAttendanceSummary: jest.fn(),
    getCategoryBreakdown: jest.fn(),
  };

  const prismaMock = {};

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
      controllers: [GradebookController],
      providers: [
        {
          provide: GradebookService,
          useValue: serviceMock,
        },
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    controller = module.get<GradebookController>(GradebookController);
  });

  it('should call getGradeMatrix', async () => {
    serviceMock.getGradeMatrix.mockResolvedValue({ rows: [] });
    const result = await controller.getGradeMatrix(mockClassId);
    expect(result).toHaveProperty('rows');
    expect(serviceMock.getGradeMatrix).toHaveBeenCalledWith(mockClassId);
  });

  it('should call getMyGradeRecord', async () => {
    serviceMock.getMyGradeRecord.mockResolvedValue({ studentId: 'student-1' });
    const result = await controller.getMyGradeRecord(
      mockUser,
      mockClassId,
      'student-1',
    );
    expect(result).toHaveProperty('studentId', 'student-1');
    expect(serviceMock.getMyGradeRecord).toHaveBeenCalledWith(
      mockUser.id,
      mockUser.role,
      mockClassId,
      'student-1',
    );
  });

  it('should call getAttendanceSummary', async () => {
    serviceMock.getAttendanceSummary.mockResolvedValue({ totalMaterials: 5 });
    const result = await controller.getAttendanceSummary(mockClassId, 'cat-1');
    expect(result).toHaveProperty('totalMaterials', 5);
    expect(serviceMock.getAttendanceSummary).toHaveBeenCalledWith(
      mockClassId,
      'cat-1',
    );
  });

  it('should call getCategoryBreakdown', async () => {
    serviceMock.getCategoryBreakdown.mockResolvedValue({ categoryId: 'cat-1' });
    const result = await controller.getCategoryBreakdown(
      mockUser,
      mockClassId,
      'cat-1',
      'student-1',
    );
    expect(result).toHaveProperty('categoryId', 'cat-1');
    expect(serviceMock.getCategoryBreakdown).toHaveBeenCalledWith(
      mockClassId,
      'cat-1',
      'student-1',
    );
  });
});
