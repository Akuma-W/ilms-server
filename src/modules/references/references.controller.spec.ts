import { Test, TestingModule } from '@nestjs/testing';
import { ReferencesController } from './references.controller';
import { ReferencesService } from './references.service';

describe('ReferencesController', () => {
  let controller: ReferencesController;

  const referencesServiceMock = {
    create: jest.fn(),
    findAllByTopic: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReferencesController],
      providers: [
        {
          provide: ReferencesService,
          useValue: referencesServiceMock,
        },
      ],
    }).compile();

    controller = module.get<ReferencesController>(ReferencesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create reference', async () => {
    const dto = {
      title: 'Clean Code Book',
      url: 'https://example.com/clean-code.pdf',
      description: 'Useful book',
    };
    referencesServiceMock.create.mockResolvedValue({
      message: 'Create reference successful',
      data: { id: 'ref-1', ...dto },
    });

    const result = await controller.create('user-1', 'topic-1', dto);
    expect(result.data.id).toBe('ref-1');
    expect(referencesServiceMock.create).toHaveBeenCalledWith(
      'user-1',
      'topic-1',
      dto,
    );
  });

  it('should find all references by topic', async () => {
    referencesServiceMock.findAllByTopic.mockResolvedValue([
      { id: 'ref-1', title: 'Ref 1' },
    ]);

    const result = await controller.findAllByTopic('topic-1');
    expect(result).toHaveLength(1);
    expect(referencesServiceMock.findAllByTopic).toHaveBeenCalledWith(
      'topic-1',
    );
  });

  it('should find one reference', async () => {
    referencesServiceMock.findOne.mockResolvedValue({
      id: 'ref-1',
      title: 'Ref 1',
    });

    const result = await controller.findOne('ref-1');
    expect(result.id).toBe('ref-1');
    expect(referencesServiceMock.findOne).toHaveBeenCalledWith('ref-1');
  });

  it('should update reference', async () => {
    const dto = { title: 'Updated Ref Title' };
    referencesServiceMock.update.mockResolvedValue({
      message: 'Update reference successful',
      data: { id: 'ref-1', ...dto },
    });

    const result = await controller.update('user-1', 'ref-1', dto);
    expect(result.data.title).toBe('Updated Ref Title');
    expect(referencesServiceMock.update).toHaveBeenCalledWith(
      'user-1',
      'ref-1',
      dto,
    );
  });

  it('should delete reference', async () => {
    referencesServiceMock.delete.mockResolvedValue({
      message: 'Delete reference successful',
    });

    const result = await controller.delete('user-1', 'ref-1');
    expect(result.message).toBe('Delete reference successful');
    expect(referencesServiceMock.delete).toHaveBeenCalledWith(
      'user-1',
      'ref-1',
    );
  });
});
