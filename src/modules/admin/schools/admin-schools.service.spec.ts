import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { SchoolStatus } from 'src/generated/prisma/enums';
import { AdminSchoolsService } from './admin-schools.service';

describe('AdminSchoolsService', () => {
  let service: AdminSchoolsService;

  const mockPrismaService = {
    school: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    user: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminSchoolsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AdminSchoolsService>(AdminSchoolsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw ConflictException if shortname already exists', async () => {
      mockPrismaService.school.findUnique.mockResolvedValue({ id: 's-1' });

      await expect(
        service.create({ name: 'ĐH KHTN', shortname: 'HCMUS', city: 'HCM' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create school successfully', async () => {
      mockPrismaService.school.findUnique.mockResolvedValue(null);
      mockPrismaService.school.create.mockResolvedValue({
        id: 's-new',
        name: 'ĐH KHTN',
        shortname: 'HCMUS',
        address: null,
        city: 'HCM',
        status: SchoolStatus.active,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create({
        name: 'ĐH KHTN',
        shortname: 'HCMUS',
        city: 'HCM',
      });

      expect(result.id).toBe('s-new');
      expect(result.name).toBe('ĐH KHTN');
      expect(result.totalStudents).toBe(0);
    });
  });

  describe('findAll', () => {
    it('should return paginated schools with metrics', async () => {
      mockPrismaService.school.count.mockResolvedValue(1);
      mockPrismaService.school.findMany.mockResolvedValue([
        {
          id: 's-1',
          name: 'ĐH CNTT',
          shortname: 'UIT',
          address: null,
          city: 'HCM',
          status: SchoolStatus.active,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { classes: 10, subjects: 5, users: 50 },
        },
      ]);
      mockPrismaService.user.count
        .mockResolvedValueOnce(45) // studentCount
        .mockResolvedValueOnce(5); // teacherCount

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].totalStudents).toBe(45);
      expect(result.data[0].totalTeachers).toBe(5);
      expect(result.data[0].totalClasses).toBe(10);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if school does not exist', async () => {
      mockPrismaService.school.findUnique.mockResolvedValue(null);

      await expect(service.remove('s-999')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if school has attached classes or users', async () => {
      mockPrismaService.school.findUnique.mockResolvedValue({
        id: 's-1',
        _count: { classes: 2, users: 10, subjects: 1 },
      });

      await expect(service.remove('s-1')).rejects.toThrow(BadRequestException);
    });

    it('should delete school successfully when no linked data exists', async () => {
      mockPrismaService.school.findUnique.mockResolvedValue({
        id: 's-empty',
        _count: { classes: 0, users: 0, subjects: 0 },
      });
      mockPrismaService.school.delete.mockResolvedValue({});

      const result = await service.remove('s-empty');

      expect(result.success).toBe(true);
      expect(mockPrismaService.school.delete).toHaveBeenCalledWith({
        where: { id: 's-empty' },
      });
    });
  });
});
