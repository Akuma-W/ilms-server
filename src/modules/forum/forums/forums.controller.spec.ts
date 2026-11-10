import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ForumsController } from './forums.controller';
import { ForumsService } from './forums.service';
import { Role } from 'src/generated/prisma/enums';
import { ForumTabFilter } from './dto/query-forum.dto';

describe('ForumsController', () => {
  let controller: ForumsController;

  const forumsServiceMock = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ForumsController],
      providers: [
        {
          provide: ForumsService,
          useValue: forumsServiceMock,
        },
      ],
    }).compile();

    controller = module.get<ForumsController>(ForumsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call service.findAll with extracted user context', async () => {
      const mockResult = [{ id: 'forum-1' }];
      forumsServiceMock.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(
        'class-1',
        { tab: ForumTabFilter.ALL },
        'user-1',
        Role.student,
      );

      expect(forumsServiceMock.findAll).toHaveBeenCalledWith(
        'class-1',
        { tab: ForumTabFilter.ALL },
        'user-1',
        Role.student,
      );
      expect(result).toBe(mockResult);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne and return forum detail', async () => {
      const mockResult = { id: 'forum-1', title: 'Topic 1' };
      forumsServiceMock.findOne.mockResolvedValue(mockResult);

      const result = await controller.findOne(
        'forum-1',
        'user-1',
        Role.student,
      );

      expect(forumsServiceMock.findOne).toHaveBeenCalledWith(
        'forum-1',
        'user-1',
        Role.student,
      );
      expect(result).toBe(mockResult);
    });

    it('should propagate service errors', async () => {
      forumsServiceMock.findOne.mockRejectedValue(
        new NotFoundException('Not found'),
      );

      await expect(
        controller.findOne('forum-1', 'user-1', Role.student),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should call service.create with payload and user credentials', async () => {
      const dto = { title: 'Topic', content: 'Content', isAnonymous: false };
      const mockResult = { id: 'forum-1', ...dto };
      forumsServiceMock.create.mockResolvedValue(mockResult);

      const result = await controller.create(
        'class-1',
        dto,
        'user-1',
        Role.student,
      );

      expect(forumsServiceMock.create).toHaveBeenCalledWith(
        'class-1',
        dto,
        'user-1',
        Role.student,
      );
      expect(result).toBe(mockResult);
    });
  });

  describe('update', () => {
    it('should call service.update and return updated forum', async () => {
      const dto = { title: 'Updated' };
      const mockResult = { id: 'forum-1', title: 'Updated' };
      forumsServiceMock.update.mockResolvedValue(mockResult);

      const result = await controller.update('forum-1', dto, 'user-1');

      expect(forumsServiceMock.update).toHaveBeenCalledWith(
        'forum-1',
        dto,
        'user-1',
      );
      expect(result).toBe(mockResult);
    });
  });

  describe('remove', () => {
    it('should call service.remove and return success confirmation', async () => {
      forumsServiceMock.remove.mockResolvedValue(undefined);

      const result = await controller.remove('forum-1', 'user-1', Role.student);

      expect(forumsServiceMock.remove).toHaveBeenCalledWith(
        'forum-1',
        'user-1',
        Role.student,
      );
      expect(result).toEqual({
        message: 'Discussion topic deleted successfully',
      });
    });
  });
});
