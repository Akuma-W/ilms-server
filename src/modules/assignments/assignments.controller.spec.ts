import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';

describe('AssignmentsController', () => {
  let controller: AssignmentsController;

  const assignmentsServiceMock = {
    create: jest.fn(),
    findAllByClass: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssignmentsController],
      providers: [
        {
          provide: AssignmentsService,
          useValue: assignmentsServiceMock,
        },
      ],
    }).compile();

    controller = module.get<AssignmentsController>(AssignmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create an assignment', async () => {
    const dto = {
      title: 'Assignment 1',
      description: 'Solve problems',
      maxScore: 10,
    };
    assignmentsServiceMock.create.mockResolvedValue({
      message: 'Create assignment successful',
      data: { id: 'assign-1', ...dto },
    });

    const result = await controller.create('user-1', 'class-1', dto);
    expect(result.data.id).toBe('assign-1');
    expect(assignmentsServiceMock.create).toHaveBeenCalledWith(
      'user-1',
      'class-1',
      dto,
    );
  });

  it('should find all assignments by class', async () => {
    assignmentsServiceMock.findAllByClass.mockResolvedValue([
      { id: 'assign-1', title: 'Assignment 1' },
    ]);

    const result = await controller.findAllByClass('user-1', 'class-1');
    expect(result.data).toHaveLength(1);
    expect(assignmentsServiceMock.findAllByClass).toHaveBeenCalledWith(
      'user-1',
      'class-1',
    );
  });

  it('should find one assignment by ID', async () => {
    assignmentsServiceMock.findOne.mockResolvedValue({
      id: 'assign-1',
      title: 'Assignment 1',
    });

    const result = await controller.findOne('user-1', 'assign-1');
    expect(result.id).toBe('assign-1');
    expect(assignmentsServiceMock.findOne).toHaveBeenCalledWith(
      'user-1',
      'assign-1',
    );
  });

  it('should update an assignment', async () => {
    const dto = { title: 'Updated Title' };
    assignmentsServiceMock.update.mockResolvedValue({
      message: 'Update assignment successful',
      data: { id: 'assign-1', ...dto },
    });

    const result = await controller.update('user-1', 'assign-1', dto);
    expect(result.data.title).toBe('Updated Title');
    expect(assignmentsServiceMock.update).toHaveBeenCalledWith(
      'user-1',
      'assign-1',
      dto,
    );
  });

  it('should delete an assignment', async () => {
    assignmentsServiceMock.delete.mockResolvedValue({
      message: 'Delete assignment successful',
    });

    const result = await controller.delete('user-1', 'assign-1');
    expect(result.message).toBe('Delete assignment successful');
    expect(assignmentsServiceMock.delete).toHaveBeenCalledWith(
      'user-1',
      'assign-1',
    );
  });
});
