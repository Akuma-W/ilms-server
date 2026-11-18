import { Test, TestingModule } from '@nestjs/testing';
import { SchoolStatus } from 'src/generated/prisma/enums';
import { AdminSchoolsController } from './admin-schools.controller';
import { AdminSchoolsService } from './admin-schools.service';

describe('AdminSchoolsController', () => {
  let controller: AdminSchoolsController;

  const mockSchoolsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockSchool = {
    id: 'school-1',
    name: 'University of Tech',
    shortname: 'UOT',
    address: '123 Tech St',
    city: 'HCMC',
    status: SchoolStatus.active,
    totalStudents: 1200,
    totalTeachers: 85,
    totalClasses: 45,
    totalSubjects: 20,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminSchoolsController],
      providers: [
        { provide: AdminSchoolsService, useValue: mockSchoolsService },
      ],
    }).compile();

    controller = module.get<AdminSchoolsController>(AdminSchoolsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll should delegate to service', async () => {
    const paginatedResult = {
      data: [mockSchool],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    };
    mockSchoolsService.findAll.mockResolvedValue(paginatedResult);

    const result = await controller.findAll({ page: 1, limit: 10 });
    expect(result.data.data).toHaveLength(1);
    expect(mockSchoolsService.findAll).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
    });
  });

  it('create should delegate to service', async () => {
    mockSchoolsService.create.mockResolvedValue(mockSchool);

    const result = await controller.create({
      name: 'University of Tech',
      city: 'HCMC',
    });
    expect(result.data.id).toBe('school-1');
    expect(mockSchoolsService.create).toHaveBeenCalled();
  });

  it('update should delegate to service', async () => {
    mockSchoolsService.update.mockResolvedValue(mockSchool);

    const result = await controller.update('school-1', { city: 'Hanoi' });
    expect(result.data.id).toBe('school-1');
    expect(mockSchoolsService.update).toHaveBeenCalledWith('school-1', {
      city: 'Hanoi',
    });
  });

  it('remove should delegate to service', async () => {
    mockSchoolsService.remove.mockResolvedValue({
      success: true,
      message: 'School deleted successfully',
    });

    const result = await controller.remove('school-1');
    expect(result.message).toBe('School deleted successfully');
    expect(mockSchoolsService.remove).toHaveBeenCalledWith('school-1');
  });
});
