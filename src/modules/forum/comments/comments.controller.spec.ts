import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { Role } from 'src/generated/prisma/enums';

describe('CommentsController', () => {
  let controller: CommentsController;

  const commentsServiceMock = {
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentsController],
      providers: [
        {
          provide: CommentsService,
          useValue: commentsServiceMock,
        },
      ],
    }).compile();

    controller = module.get<CommentsController>(CommentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call commentsService.create with forumId and user context', async () => {
      const dto = { content: 'Nice comment', isAnonymous: false };
      const mockResult = { id: 'comment-1', ...dto };
      commentsServiceMock.create.mockResolvedValue(mockResult);

      const result = await controller.create(
        'forum-1',
        dto,
        'user-1',
        Role.student,
      );

      expect(commentsServiceMock.create).toHaveBeenCalledWith(
        'forum-1',
        dto,
        'user-1',
        Role.student,
      );
      expect(result).toBe(mockResult);
    });

    it('should propagate service errors', async () => {
      commentsServiceMock.create.mockRejectedValue(
        new NotFoundException('Forum not found'),
      );

      await expect(
        controller.create(
          'forum-1',
          { content: 'test' },
          'user-1',
          Role.student,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should call commentsService.update and return updated comment', async () => {
      const dto = { content: 'Updated' };
      const mockResult = { id: 'comment-1', content: 'Updated' };
      commentsServiceMock.update.mockResolvedValue(mockResult);

      const result = await controller.update(
        'forum-1',
        'comment-1',
        dto,
        'user-1',
      );

      expect(commentsServiceMock.update).toHaveBeenCalledWith(
        'forum-1',
        'comment-1',
        dto,
        'user-1',
      );
      expect(result).toBe(mockResult);
    });
  });

  describe('remove', () => {
    it('should call commentsService.remove and return success confirmation', async () => {
      commentsServiceMock.remove.mockResolvedValue(undefined);

      const result = await controller.remove(
        'forum-1',
        'comment-1',
        'user-1',
        Role.student,
      );

      expect(commentsServiceMock.remove).toHaveBeenCalledWith(
        'forum-1',
        'comment-1',
        'user-1',
        Role.student,
      );
      expect(result).toEqual({
        message: 'Comment deleted successfully',
      });
    });
  });
});
