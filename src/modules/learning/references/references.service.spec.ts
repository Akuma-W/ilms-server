import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ReferencesService } from './references.service';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';

describe('ReferencesService', () => {
  let service: ReferencesService;

  const prismaMock = {
    topic: {
      findUnique: jest.fn(),
    },
    class: {
      findUnique: jest.fn(),
    },
    enrollment: {
      findFirst: jest.fn(),
    },
    reference: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferencesService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<ReferencesService>(ReferencesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw NotFoundException if topic does not exist', async () => {
      prismaMock.topic.findUnique.mockResolvedValue(null);

      await expect(
        service.create('user-1', 'topic-1', {
          title: 'Reference 1',
          url: 'https://example.com',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not teacher', async () => {
      prismaMock.topic.findUnique.mockResolvedValue({
        id: 'topic-1',
        classId: 'class-1',
      });
      prismaMock.class.findUnique.mockResolvedValue({
        id: 'class-1',
        teacherId: 'other-user',
      });
      prismaMock.enrollment.findFirst.mockResolvedValue(null);

      await expect(
        service.create('user-1', 'topic-1', {
          title: 'Reference 1',
          url: 'https://example.com',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create reference when user is class teacher', async () => {
      prismaMock.topic.findUnique.mockResolvedValue({
        id: 'topic-1',
        classId: 'class-1',
      });
      prismaMock.class.findUnique.mockResolvedValue({
        id: 'class-1',
        teacherId: 'user-1',
      });
      prismaMock.reference.create.mockResolvedValue({
        id: 'ref-1',
        title: 'Reference 1',
        url: 'https://example.com',
        topicId: 'topic-1',
      });

      const result = await service.create('user-1', 'topic-1', {
        title: 'Reference 1',
        url: 'https://example.com',
      });

      expect(result.data.id).toBe('ref-1');
      expect(prismaMock.reference.create).toHaveBeenCalled();
    });
  });

  describe('findAllByTopic', () => {
    it('should throw NotFoundException if topic does not exist', async () => {
      prismaMock.topic.findUnique.mockResolvedValue(null);

      await expect(service.findAllByTopic('topic-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return references for topic', async () => {
      prismaMock.topic.findUnique.mockResolvedValue({ id: 'topic-1' });
      prismaMock.reference.findMany.mockResolvedValue([
        { id: 'ref-1', title: 'Ref 1' },
      ]);

      const result = await service.findAllByTopic('topic-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if reference does not exist', async () => {
      prismaMock.reference.findUnique.mockResolvedValue(null);

      await expect(service.findOne('ref-1')).rejects.toThrow(NotFoundException);
    });

    it('should return reference', async () => {
      prismaMock.reference.findUnique.mockResolvedValue({
        id: 'ref-1',
        title: 'Ref 1',
      });

      const result = await service.findOne('ref-1');
      expect(result.id).toBe('ref-1');
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if reference does not exist', async () => {
      prismaMock.reference.findUnique.mockResolvedValue(null);

      await expect(
        service.update('user-1', 'ref-1', { title: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update reference if authorized', async () => {
      prismaMock.reference.findUnique.mockResolvedValue({
        id: 'ref-1',
        topic: { classId: 'class-1' },
      });
      prismaMock.class.findUnique.mockResolvedValue({
        id: 'class-1',
        teacherId: 'user-1',
      });
      prismaMock.reference.update.mockResolvedValue({
        id: 'ref-1',
        title: 'New',
      });

      const result = await service.update('user-1', 'ref-1', { title: 'New' });
      expect(result.data.title).toBe('New');
    });
  });

  describe('delete', () => {
    it('should throw NotFoundException if reference does not exist', async () => {
      prismaMock.reference.findUnique.mockResolvedValue(null);

      await expect(service.delete('user-1', 'ref-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should delete reference if authorized', async () => {
      prismaMock.reference.findUnique.mockResolvedValue({
        id: 'ref-1',
        topic: { classId: 'class-1' },
      });
      prismaMock.class.findUnique.mockResolvedValue({
        id: 'class-1',
        teacherId: 'user-1',
      });
      prismaMock.reference.delete.mockResolvedValue({ id: 'ref-1' });

      const result = await service.delete('user-1', 'ref-1');
      expect(result.message).toBe('Delete reference successful');
    });
  });
});
