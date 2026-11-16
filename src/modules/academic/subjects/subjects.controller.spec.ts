import { Test, TestingModule } from '@nestjs/testing';
import { Role } from 'src/generated/prisma/enums';
import type { AuthUser } from 'src/modules/auth/session/interfaces/auth-user.interface';
import { SubjectsController } from './subjects.controller';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { QuerySubjectDto } from './dto/query-subject.dto';

describe('SubjectsController', () => {
  let controller: SubjectsController;

  const mockSubjectsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findSubjectClasses: jest.fn(),
  };

  const mockUser: AuthUser = {
    id: 'user-uuid',
    jti: 'jti-1',
    role: Role.admin,
    exp: 999999999,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubjectsController],
      providers: [
        {
          provide: SubjectsService,
          useValue: mockSubjectsService,
        },
      ],
    }).compile();

    controller = module.get<SubjectsController>(SubjectsController);
  });

  it('should create subject', async () => {
    const dto: CreateSubjectDto = {
      schoolId: 'school-1',
      code: 'IT001',
      name: 'Intro CS',
    };
    mockSubjectsService.create.mockResolvedValue({ id: 'sub-1', ...dto });

    const result = await controller.create(dto);
    expect(mockSubjectsService.create).toHaveBeenCalledWith(dto);
    expect(result.id).toBe('sub-1');
  });

  it('should find all subjects', async () => {
    const query: QuerySubjectDto = { page: 1, limit: 10 };
    mockSubjectsService.findAll.mockResolvedValue({ data: [], meta: {} });

    await controller.findAll(mockUser, query);
    expect(mockSubjectsService.findAll).toHaveBeenCalledWith(mockUser, query);
  });

  it('should find one subject', async () => {
    mockSubjectsService.findOne.mockResolvedValue({ id: 'sub-1' });

    const result = await controller.findOne('sub-1', mockUser);
    expect(mockSubjectsService.findOne).toHaveBeenCalledWith('sub-1', mockUser);
    expect(result.id).toBe('sub-1');
  });

  it('should update subject', async () => {
    const dto: UpdateSubjectDto = { name: 'Updated CS' };
    mockSubjectsService.update.mockResolvedValue({ id: 'sub-1', ...dto });

    const result = await controller.update('sub-1', dto);
    expect(mockSubjectsService.update).toHaveBeenCalledWith('sub-1', dto);
    expect(result.name).toBe('Updated CS');
  });

  it('should remove subject', async () => {
    mockSubjectsService.remove.mockResolvedValue({
      message: 'Subject deleted successfully',
    });

    const result = await controller.remove('sub-1');
    expect(mockSubjectsService.remove).toHaveBeenCalledWith('sub-1');
    expect(result.message).toBe('Subject deleted successfully');
  });

  it('should find classes under subject', async () => {
    mockSubjectsService.findSubjectClasses.mockResolvedValue([]);

    const result = await controller.findSubjectClasses('sub-1', mockUser);
    expect(mockSubjectsService.findSubjectClasses).toHaveBeenCalledWith(
      'sub-1',
      mockUser,
    );
    expect(result).toEqual([]);
  });
});
