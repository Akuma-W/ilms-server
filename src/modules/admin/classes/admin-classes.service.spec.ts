import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { Role } from 'src/generated/prisma/enums';
import { AdminClassesService } from './admin-classes.service';

describe('AdminClassesService', () => {
  let service: AdminClassesService;

  const mockPrismaService = {
    class: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    school: {
      findUnique: jest.fn(),
    },
    subject: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminClassesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AdminClassesService>(AdminClassesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated classes filtered by criteria', async () => {
      mockPrismaService.class.count.mockResolvedValue(1);
      mockPrismaService.class.findMany.mockResolvedValue([
        {
          id: 'c-1',
          title: 'Lớp 01',
          teacher: {
            id: 't-1',
            fullName: 'Thầy A',
            email: 'a@edu.vn',
            avatarUrl: null,
          },
          subjectRef: {
            id: 's-1',
            code: 'IT001',
            name: 'Nhập môn',
            credits: 3,
          },
          school: { id: 'sch-1', name: 'ĐH A', shortname: 'DHA' },
        },
      ]);

      const result = await service.findAll({
        page: 1,
        limit: 10,
        isArchived: false,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('Lớp 01');
      expect(result.meta.total).toBe(1);
    });
  });

  describe('toggleArchive', () => {
    it('should toggle archive status successfully', async () => {
      mockPrismaService.class.findUnique.mockResolvedValue({
        id: 'c-1',
        title: 'Lớp 01',
        isArchived: false,
        teacher: {
          id: 't-1',
          fullName: 'Thầy A',
          email: 'a@edu.vn',
          avatarUrl: null,
        },
        subjectRef: { id: 's-1', code: 'IT001', name: 'Nhập môn', credits: 3 },
        school: { id: 'sch-1', name: 'ĐH A', shortname: 'DHA' },
      });
      mockPrismaService.class.update.mockResolvedValue({
        id: 'c-1',
        isArchived: true,
      });

      const result = await service.toggleArchive('c-1', true);

      expect(result.id).toBe('c-1');
      expect(mockPrismaService.class.update).toHaveBeenCalledWith({
        where: { id: 'c-1' },
        data: { isArchived: true },
      });
    });

    it('should throw NotFoundException if class does not exist', async () => {
      mockPrismaService.class.findUnique.mockResolvedValue(null);

      await expect(service.toggleArchive('c-999', true)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create classroom successfully', async () => {
      mockPrismaService.school.findUnique.mockResolvedValue({ id: 'sch-1' });
      mockPrismaService.subject.findUnique.mockResolvedValue({ id: 'sub-1' });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 't-1',
        role: Role.teacher,
      });
      mockPrismaService.class.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 'c-new',
          title: 'Class New',
          teacher: {
            id: 't-1',
            fullName: 'Teacher 1',
            email: 't@edu.vn',
            avatarUrl: null,
          },
          subjectRef: { id: 'sub-1', code: 'CS1', name: 'CS', credits: 3 },
          school: { id: 'sch-1', name: 'Sch', shortname: 'S' },
        });
      mockPrismaService.class.create.mockResolvedValue({ id: 'c-new' });

      const result = await service.create({
        title: 'Class New',
        schoolId: 'sch-1',
        subjectId: 'sub-1',
        teacherId: 't-1',
        courseCode: 'CS101-A',
      });

      expect(result.id).toBe('c-new');
      expect(mockPrismaService.class.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if instructor is not teacher', async () => {
      mockPrismaService.school.findUnique.mockResolvedValue({ id: 'sch-1' });
      mockPrismaService.subject.findUnique.mockResolvedValue({ id: 'sub-1' });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'u-1',
        role: Role.student,
      });

      await expect(
        service.create({
          title: 'Class New',
          schoolId: 'sch-1',
          subjectId: 'sub-1',
          teacherId: 'u-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update classroom successfully', async () => {
      mockPrismaService.class.findUnique.mockResolvedValue({
        id: 'c-1',
        title: 'Class Updated',
        teacher: {
          id: 't-1',
          fullName: 'Teacher 1',
          email: 't@edu.vn',
          avatarUrl: null,
        },
        subjectRef: { id: 'sub-1', code: 'CS1', name: 'CS', credits: 3 },
        school: { id: 'sch-1', name: 'Sch', shortname: 'S' },
      });
      mockPrismaService.class.update.mockResolvedValue({ id: 'c-1' });

      const result = await service.update('c-1', { title: 'Class Updated' });

      expect(result.id).toBe('c-1');
      expect(mockPrismaService.class.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete class successfully', async () => {
      mockPrismaService.class.findUnique.mockResolvedValue({ id: 'c-1' });
      mockPrismaService.class.delete.mockResolvedValue({});

      const result = await service.remove('c-1');

      expect(result.success).toBe(true);
      expect(mockPrismaService.class.delete).toHaveBeenCalledWith({
        where: { id: 'c-1' },
      });
    });
  });
});
