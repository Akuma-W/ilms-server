import { Test, TestingModule } from '@nestjs/testing';
import { SchoolsController } from './schools.controller';
import { SchoolsService } from './schools.service';
import { Role } from 'src/generated/prisma/enums';
import type { AuthUser } from 'src/modules/auth/session/interfaces/auth-user.interface';

describe('SchoolsController', () => {
  let controller: SchoolsController;
  const schoolsServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findSchoolTeachers: jest.fn(),
  };

  const mockTeacher: AuthUser = {
    id: 'teacher-1',
    jti: 'jti-1',
    role: Role.teacher,
    exp: 9999999999,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchoolsController],
      providers: [
        {
          provide: SchoolsService,
          useValue: schoolsServiceMock,
        },
      ],
    }).compile();

    controller = module.get<SchoolsController>(SchoolsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate findSchoolTeachers to schoolsService', async () => {
    schoolsServiceMock.findSchoolTeachers.mockResolvedValue([
      { id: 'teacher-2', fullName: 'Nguyen Van B' },
    ]);

    const result = await controller.findSchoolTeachers(mockTeacher, 'Nguyen');
    expect(schoolsServiceMock.findSchoolTeachers).toHaveBeenCalledWith(
      'teacher-1',
      'Nguyen',
    );
    expect(result.data).toHaveLength(1);
  });
});
