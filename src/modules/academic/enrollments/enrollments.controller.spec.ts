import { Test, TestingModule } from '@nestjs/testing';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';

describe('EnrollmentsController', () => {
  let controller: EnrollmentsController;
  const serviceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    getStarredClasses: jest.fn(),
    toggleStar: jest.fn(),
    leaveClass: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnrollmentsController],
      providers: [
        {
          provide: EnrollmentsService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get<EnrollmentsController>(EnrollmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should join class', async () => {
    serviceMock.create.mockResolvedValue({ id: 'en-1' });

    const result = await controller.create('user-uuid', {
      classId: 'class-uuid',
    });
    expect(result.message).toBe('Join class successful');
    expect(result.data).toEqual({ id: 'en-1' });
    expect(serviceMock.create).toHaveBeenCalledWith(
      { classId: 'class-uuid' },
      'user-uuid',
    );
  });

  it('should get my enrollments', async () => {
    serviceMock.findAll.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 1 },
    });

    const result = await controller.getMyEnrollments('user-uuid', {
      page: 1,
      limit: 10,
    });
    expect(result.message).toBe('Get my enrollments successful');
    expect(serviceMock.findAll).toHaveBeenCalledWith('user-uuid', {
      page: 1,
      limit: 10,
    });
  });

  it('should get user enrollments (admin)', async () => {
    serviceMock.findAll.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 1 },
    });

    const result = await controller.getUserEnrollments('target-user-uuid', {
      page: 1,
      limit: 10,
    });
    expect(result.message).toBe('Get user enrollments successful');
    expect(serviceMock.findAll).toHaveBeenCalledWith('target-user-uuid', {
      page: 1,
      limit: 10,
    });
  });

  it('should get starred classes', async () => {
    serviceMock.getStarredClasses.mockResolvedValue({ classes: [], total: 0 });

    const result = await controller.getStarredClasses('user-uuid');
    expect(result.message).toBe('Get starred classes success');
  });

  it('should get class relation', async () => {
    serviceMock.findOne.mockResolvedValue({ id: 'en-1' });

    const result = await controller.getMyClassRelation(
      'user-uuid',
      'class-uuid',
    );
    expect(result.message).toBe('Get class relation success');
    expect(result.data).toEqual({ id: 'en-1' });
  });

  it('should toggle star', async () => {
    serviceMock.toggleStar.mockResolvedValue({ id: 'en-1', isStarred: true });

    const result = await controller.toggleStar('user-uuid', 'en-1');
    expect(result.message).toBe('Toggle star success');
  });

  it('should leave class', async () => {
    serviceMock.leaveClass.mockResolvedValue({
      message: 'Leave class successful',
    });

    const result = await controller.leaveClass('user-uuid', 'class-uuid');
    expect(result.message).toBe('Leave class successful');
  });
});
