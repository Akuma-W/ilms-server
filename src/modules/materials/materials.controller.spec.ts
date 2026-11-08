import { Test, TestingModule } from '@nestjs/testing';
import { MaterialsController } from './materials.controller';
import { MaterialsService } from './materials.service';
import { FileType } from 'src/generated/prisma/enums';

describe('MaterialsController', () => {
  let controller: MaterialsController;

  const materialsServiceMock = {
    create: jest.fn(),
    findAllByTopic: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MaterialsController],
      providers: [
        {
          provide: MaterialsService,
          useValue: materialsServiceMock,
        },
      ],
    }).compile();

    controller = module.get<MaterialsController>(MaterialsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create material', async () => {
    const dto = {
      title: 'Chapter 1 Slide',
      materialType: FileType.slide,
      fileUrl: 'uploads/slide.pdf',
    };
    materialsServiceMock.create.mockResolvedValue({
      message: 'Create material successful',
      data: { id: 'mat-1', ...dto },
    });

    const result = await controller.create('user-1', 'topic-1', dto);
    expect(result.data.id).toBe('mat-1');
    expect(materialsServiceMock.create).toHaveBeenCalledWith(
      'user-1',
      'topic-1',
      dto,
    );
  });

  it('should find all materials by topic', async () => {
    materialsServiceMock.findAllByTopic.mockResolvedValue([
      { id: 'mat-1', title: 'Doc 1' },
    ]);

    const result = await controller.findAllByTopic('topic-1');
    expect(result).toHaveLength(1);
    expect(materialsServiceMock.findAllByTopic).toHaveBeenCalledWith('topic-1');
  });

  it('should find one material', async () => {
    materialsServiceMock.findOne.mockResolvedValue({
      id: 'mat-1',
      title: 'Doc 1',
    });

    const result = await controller.findOne('mat-1');
    expect(result.id).toBe('mat-1');
    expect(materialsServiceMock.findOne).toHaveBeenCalledWith('mat-1');
  });

  it('should update material', async () => {
    const dto = { title: 'Updated Title' };
    materialsServiceMock.update.mockResolvedValue({
      message: 'Update material successful',
      data: { id: 'mat-1', ...dto },
    });

    const result = await controller.update('user-1', 'mat-1', dto);
    expect(result.data.title).toBe('Updated Title');
    expect(materialsServiceMock.update).toHaveBeenCalledWith(
      'user-1',
      'mat-1',
      dto,
    );
  });

  it('should delete material', async () => {
    materialsServiceMock.delete.mockResolvedValue({
      message: 'Delete material successful',
    });

    const result = await controller.delete('user-1', 'mat-1');
    expect(result.message).toBe('Delete material successful');
    expect(materialsServiceMock.delete).toHaveBeenCalledWith('user-1', 'mat-1');
  });
});
