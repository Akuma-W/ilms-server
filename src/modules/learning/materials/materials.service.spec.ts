import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MaterialsService } from './materials.service';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { FileType } from 'src/generated/prisma/enums';

describe('MaterialsService', () => {
  let service: MaterialsService;

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
    material: {
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
        MaterialsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<MaterialsService>(MaterialsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw NotFoundException if topic does not exist', async () => {
      prismaMock.topic.findUnique.mockResolvedValue(null);

      await expect(
        service.create('user-1', 'topic-1', {
          title: 'Slide',
          materialType: FileType.slide,
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
          title: 'Slide',
          materialType: FileType.slide,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create material when user is class teacher', async () => {
      prismaMock.topic.findUnique.mockResolvedValue({
        id: 'topic-1',
        classId: 'class-1',
      });
      prismaMock.class.findUnique.mockResolvedValue({
        id: 'class-1',
        teacherId: 'user-1',
      });
      prismaMock.material.create.mockResolvedValue({
        id: 'mat-1',
        title: 'Slide',
        materialType: FileType.slide,
      });

      const result = await service.create('user-1', 'topic-1', {
        title: 'Slide',
        materialType: FileType.slide,
      });

      expect(result.data.id).toBe('mat-1');
      expect(prismaMock.material.create).toHaveBeenCalled();
    });
  });

  describe('findAllByTopic', () => {
    it('should throw NotFoundException if topic does not exist', async () => {
      prismaMock.topic.findUnique.mockResolvedValue(null);

      await expect(service.findAllByTopic('topic-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return materials for topic', async () => {
      prismaMock.topic.findUnique.mockResolvedValue({ id: 'topic-1' });
      prismaMock.material.findMany.mockResolvedValue([
        { id: 'mat-1', title: 'Slide 1' },
      ]);

      const result = await service.findAllByTopic('topic-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if material does not exist', async () => {
      prismaMock.material.findUnique.mockResolvedValue(null);

      await expect(service.findOne('mat-1')).rejects.toThrow(NotFoundException);
    });

    it('should return material', async () => {
      prismaMock.material.findUnique.mockResolvedValue({
        id: 'mat-1',
        title: 'Slide 1',
      });

      const result = await service.findOne('mat-1');
      expect(result.id).toBe('mat-1');
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if material does not exist', async () => {
      prismaMock.material.findUnique.mockResolvedValue(null);

      await expect(
        service.update('user-1', 'mat-1', { title: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update material if authorized', async () => {
      prismaMock.material.findUnique.mockResolvedValue({
        id: 'mat-1',
        topic: { classId: 'class-1' },
      });
      prismaMock.class.findUnique.mockResolvedValue({
        id: 'class-1',
        teacherId: 'user-1',
      });
      prismaMock.material.update.mockResolvedValue({
        id: 'mat-1',
        title: 'New',
      });

      const result = await service.update('user-1', 'mat-1', { title: 'New' });
      expect(result.data.title).toBe('New');
    });
  });

  describe('delete', () => {
    it('should throw NotFoundException if material does not exist', async () => {
      prismaMock.material.findUnique.mockResolvedValue(null);

      await expect(service.delete('user-1', 'mat-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should delete material if authorized', async () => {
      prismaMock.material.findUnique.mockResolvedValue({
        id: 'mat-1',
        topic: { classId: 'class-1' },
      });
      prismaMock.class.findUnique.mockResolvedValue({
        id: 'class-1',
        teacherId: 'user-1',
      });
      prismaMock.material.delete.mockResolvedValue({ id: 'mat-1' });

      const result = await service.delete('user-1', 'mat-1');
      expect(result.message).toBe('Delete material successful');
    });
  });
});
