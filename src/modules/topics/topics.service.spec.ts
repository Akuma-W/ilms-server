import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TopicsService } from './topics.service';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';

describe('TopicsService', () => {
  let service: TopicsService;

  const prismaMock = {
    class: {
      findUnique: jest.fn(),
    },
    enrollment: {
      findFirst: jest.fn(),
    },
    topic: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    material: {
      deleteMany: jest.fn(),
    },
    reference: {
      deleteMany: jest.fn(),
    },
    quizPublication: {
      deleteMany: jest.fn(),
    },
    assignment: {
      deleteMany: jest.fn(),
    },
    conversation: {
      deleteMany: jest.fn(),
    },
    embedding: {
      deleteMany: jest.fn(),
    },
    retrievalCache: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TopicsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<TopicsService>(TopicsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw NotFoundException if class does not exist', async () => {
      prismaMock.class.findUnique.mockResolvedValue(null);

      await expect(
        service.create('user-1', 'class-1', { title: 'Topic 1' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not teacher', async () => {
      prismaMock.class.findUnique.mockResolvedValue({
        id: 'class-1',
        teacherId: 'other-user',
      });
      prismaMock.enrollment.findFirst.mockResolvedValue(null);

      await expect(
        service.create('user-1', 'class-1', { title: 'Topic 1' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create topic with incremented orderIndex', async () => {
      prismaMock.class.findUnique.mockResolvedValue({
        id: 'class-1',
        teacherId: 'user-1',
      });
      prismaMock.topic.findFirst.mockResolvedValue({ orderIndex: 3 });
      prismaMock.topic.create.mockResolvedValue({
        id: 'topic-1',
        title: 'Topic 1',
        orderIndex: 4,
      });

      const result = await service.create('user-1', 'class-1', {
        title: 'Topic 1',
      });

      expect(result.data.id).toBe('topic-1');
      expect(prismaMock.topic.create).toHaveBeenCalledWith({
        data: {
          title: 'Topic 1',
          classId: 'class-1',
          createdBy: 'user-1',
          orderIndex: 4,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return topics with materials and references included', async () => {
      prismaMock.topic.findMany.mockResolvedValue([
        {
          id: 'topic-1',
          title: 'Topic 1',
          materials: [],
          references: [],
        },
      ]);

      const result = await service.findAll('class-1');
      expect(result).toHaveLength(1);
      expect(prismaMock.topic.findMany).toHaveBeenCalledWith({
        where: { classId: 'class-1' },
        include: {
          materials: {
            orderBy: { createdAt: 'asc' },
          },
          references: {
            orderBy: { title: 'asc' },
          },
        },
        orderBy: { orderIndex: 'asc' },
      });
    });
  });

  describe('findMany', () => {
    it('should search topics by title', async () => {
      prismaMock.topic.findMany.mockResolvedValue([
        { id: 'topic-1', title: 'Calculus' },
      ]);

      const result = await service.findMany('class-1', 'calc');
      expect(result).toHaveLength(1);
      expect(prismaMock.topic.findMany).toHaveBeenCalledWith({
        where: {
          classId: 'class-1',
          title: {
            contains: 'calc',
            mode: 'insensitive',
          },
        },
      });
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if topic does not exist', async () => {
      prismaMock.topic.findUnique.mockResolvedValue(null);

      await expect(
        service.update('user-1', 'topic-1', { title: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update topic when user is creator', async () => {
      prismaMock.topic.findUnique.mockResolvedValue({
        id: 'topic-1',
        createdBy: 'user-1',
        classId: 'class-1',
      });
      prismaMock.topic.update.mockResolvedValue({
        id: 'topic-1',
        title: 'Updated',
      });

      const result = await service.update('user-1', 'topic-1', {
        title: 'Updated',
      });
      expect(result.title).toBe('Updated');
    });

    it('should update topic when user is class teacher', async () => {
      prismaMock.topic.findUnique.mockResolvedValue({
        id: 'topic-1',
        createdBy: 'user-2',
        classId: 'class-1',
      });
      prismaMock.class.findUnique.mockResolvedValue({
        id: 'class-1',
        teacherId: 'user-1',
      });
      prismaMock.topic.update.mockResolvedValue({
        id: 'topic-1',
        title: 'Updated',
      });

      const result = await service.update('user-1', 'topic-1', {
        title: 'Updated',
      });
      expect(result.title).toBe('Updated');
    });
  });

  describe('delete', () => {
    it('should throw NotFoundException if topic does not exist', async () => {
      prismaMock.topic.findUnique.mockResolvedValue(null);

      await expect(service.delete('user-1', 'topic-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should delete topic with all resources in transaction', async () => {
      prismaMock.topic.findUnique.mockResolvedValue({
        id: 'topic-1',
        createdBy: 'user-1',
        classId: 'class-1',
      });
      prismaMock.$transaction.mockResolvedValue([]);

      await service.delete('user-1', 'topic-1');
      expect(prismaMock.$transaction).toHaveBeenCalled();
    });
  });
});
