import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { AdminClassesController } from './admin-classes.controller';
import { AdminClassesService } from './admin-classes.service';
import { QueryAdminClassesDto } from './dto/query-admin-classes.dto';

describe('AdminClassesController', () => {
  let controller: AdminClassesController;

  const mockClassesService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    toggleArchive: jest.fn(),
    remove: jest.fn(),
  };

  const mockClass = {
    id: 'class-1',
    title: 'Intro to Programming',
    courseCode: 'CS101',
    isArchived: false,
    isPrivate: false,
    totalStudents: 30,
    maxStudents: 50,
    teacher: {
      id: 'teacher-1',
      fullName: 'Dr. Smith',
      email: 'smith@edu.vn',
      avatarUrl: null,
    },
    subjectRef: { id: 'sub-1', code: 'CS101', name: 'Intro CS', credits: 3 },
    school: { id: 'sch-1', name: 'UOT', shortname: 'UOT' },
    createdAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminClassesController],
      providers: [
        { provide: AdminClassesService, useValue: mockClassesService },
      ],
    }).compile();

    controller = module.get<AdminClassesController>(AdminClassesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should validate and transform query params with ValidationPipe', async () => {
    const pipe = new ValidationPipe({
      transform: true,
      whitelist: true,
      transformOptions: { enableImplicitConversion: true },
    });
    const transformed = (await pipe.transform(
      { isArchived: 'false', page: '1', limit: '10' },
      { type: 'query', metatype: QueryAdminClassesDto },
    )) as QueryAdminClassesDto;
    expect(transformed.isArchived).toBe(false);

    const transformedTrue = (await pipe.transform(
      { isArchived: 'true', page: '1', limit: '10' },
      { type: 'query', metatype: QueryAdminClassesDto },
    )) as QueryAdminClassesDto;
    expect(transformedTrue.isArchived).toBe(true);
  });

  it('findAll should delegate to service', async () => {
    const paginatedResult = {
      data: [mockClass],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    };
    mockClassesService.findAll.mockResolvedValue(paginatedResult);

    const result = await controller.findAll({ page: 1, limit: 10 });
    expect(result.data.data).toHaveLength(1);
    expect(mockClassesService.findAll).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
    });
  });

  it('create should delegate to service', async () => {
    mockClassesService.create.mockResolvedValue(mockClass);

    const dto = {
      title: 'Intro to Programming',
      schoolId: 'sch-1',
      subjectId: 'sub-1',
      teacherId: 'teacher-1',
    };
    const result = await controller.create(dto);
    expect(result.data.id).toBe('class-1');
    expect(mockClassesService.create).toHaveBeenCalledWith(dto);
  });

  it('update should delegate to service', async () => {
    mockClassesService.update.mockResolvedValue({
      ...mockClass,
      title: 'Advanced Programming',
    });

    const dto = { title: 'Advanced Programming' };
    const result = await controller.update('class-1', dto);
    expect(result.data.title).toBe('Advanced Programming');
    expect(mockClassesService.update).toHaveBeenCalledWith('class-1', dto);
  });

  it('archive should delegate to service', async () => {
    mockClassesService.toggleArchive.mockResolvedValue({
      ...mockClass,
      isArchived: true,
    });

    const result = await controller.archive('class-1');
    expect(result.data.isArchived).toBe(true);
    expect(mockClassesService.toggleArchive).toHaveBeenCalledWith(
      'class-1',
      true,
    );
  });

  it('unarchive should delegate to service', async () => {
    mockClassesService.toggleArchive.mockResolvedValue({
      ...mockClass,
      isArchived: false,
    });

    const result = await controller.unarchive('class-1');
    expect(result.data.isArchived).toBe(false);
    expect(mockClassesService.toggleArchive).toHaveBeenCalledWith(
      'class-1',
      false,
    );
  });

  it('remove should delegate to service', async () => {
    mockClassesService.remove.mockResolvedValue({
      success: true,
      message: 'Classroom deleted successfully',
    });

    const result = await controller.remove('class-1');
    expect(result.message).toBe('Classroom deleted successfully');
    expect(mockClassesService.remove).toHaveBeenCalledWith('class-1');
  });
});
