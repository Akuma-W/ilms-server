import { Test, TestingModule } from '@nestjs/testing';
import { SchoolsService } from './schools.service';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';

describe('SchoolsService', () => {
  let service: SchoolsService;
  const prismaMock = {
    school: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchoolsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<SchoolsService>(SchoolsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find active teachers in school excluding current user', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ schoolId: 'school-1' });
    prismaMock.user.findMany.mockResolvedValue([
      { id: 'teacher-2', fullName: 'Nguyen Van B', email: 'b@uit.edu.vn' },
    ]);

    const result = await service.findSchoolTeachers('teacher-1', 'Nguyen');
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'teacher-1' },
      select: { schoolId: true },
    });
    expect(prismaMock.user.findMany).toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('teacher-2');
  });

  it('should return empty list if user has no school', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ schoolId: null });

    const result = await service.findSchoolTeachers('teacher-1');
    expect(result).toEqual([]);
    expect(prismaMock.user.findMany).not.toHaveBeenCalled();
  });
});
