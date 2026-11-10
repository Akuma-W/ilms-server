import { Test, TestingModule } from '@nestjs/testing';
import { TopicsController } from './topics.controller';
import { TopicsService } from './topics.service';

describe('TopicsController', () => {
  let controller: TopicsController;

  const topicsServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TopicsController],
      providers: [
        {
          provide: TopicsService,
          useValue: topicsServiceMock,
        },
      ],
    }).compile();

    controller = module.get<TopicsController>(TopicsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create topic', async () => {
    const dto = { title: 'Chapter 1' };
    topicsServiceMock.create.mockResolvedValue({
      message: 'Create topic successful',
      data: { id: 'topic-1', ...dto },
    });

    const result = await controller.create('user-1', 'class-1', dto);
    expect(result.data.id).toBe('topic-1');
    expect(topicsServiceMock.create).toHaveBeenCalledWith(
      'user-1',
      'class-1',
      dto,
    );
  });

  it('should find all topics in a class', async () => {
    topicsServiceMock.findAll.mockResolvedValue([
      { id: 'topic-1', title: 'Chapter 1' },
    ]);

    const result = await controller.findAll('class-1');
    expect(result).toHaveLength(1);
    expect(topicsServiceMock.findAll).toHaveBeenCalledWith('class-1');
  });

  it('should search topics in a class', async () => {
    topicsServiceMock.findMany.mockResolvedValue([
      { id: 'topic-1', title: 'Chapter 1' },
    ]);

    const result = await controller.search('class-1', { title: 'Chapter' });
    expect(result).toHaveLength(1);
    expect(topicsServiceMock.findMany).toHaveBeenCalledWith(
      'class-1',
      'Chapter',
    );
  });

  it('should update topic', async () => {
    const dto = { title: 'New Chapter' };
    topicsServiceMock.update.mockResolvedValue({
      id: 'topic-1',
      title: 'New Chapter',
    });

    const result = await controller.update('user-1', 'topic-1', dto);
    expect(result.message).toBe('Update topic successful');
    expect(result.data.title).toBe('New Chapter');
    expect(topicsServiceMock.update).toHaveBeenCalledWith(
      'user-1',
      'topic-1',
      dto,
    );
  });

  it('should delete topic', async () => {
    topicsServiceMock.delete.mockResolvedValue(undefined);

    const result = await controller.delete('user-1', 'topic-1');
    expect(result.message).toBe('Delete topic successful');
    expect(topicsServiceMock.delete).toHaveBeenCalledWith('user-1', 'topic-1');
  });
});
