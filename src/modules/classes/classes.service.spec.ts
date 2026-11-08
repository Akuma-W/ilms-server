import { Test, TestingModule } from '@nestjs/testing';
import { ClassesService } from './classes.service';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { UsersService } from 'src/modules/users/users.service';

describe('ClassesService', () => {
  let service: ClassesService;
  const prismaMock = {
    class: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };
  const usersMock = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassesService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: UsersService,
          useValue: usersMock,
        },
      ],
    }).compile();

    service = module.get<ClassesService>(ClassesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate a 6-character alphanumeric uppercase course code', () => {
    const code = (
      service as unknown as { generateCode: () => string }
    ).generateCode();
    expect(code).toBeDefined();
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
  });

  it('should map totalStudents from _count.enrollments in findOne', async () => {
    prismaMock.class.findUnique.mockResolvedValue({
      id: 'class-uuid',
      title: 'Math 101',
      _count: { enrollments: 34 },
    });

    const result = await service.findOne('class-uuid');
    expect(result.totalStudents).toBe(34);
  });

  it('should map totalStudents in findAll', async () => {
    usersMock.findOne.mockResolvedValue({ schoolId: 'school-uuid' });
    prismaMock.class.findMany.mockResolvedValue([
      {
        id: 'class-uuid',
        title: 'Math 101',
        enrollments: [],
        _count: { enrollments: 18 },
      },
    ]);
    prismaMock.class.count.mockResolvedValue(1);

    const result = await service.findAll('user-uuid', { page: 1, limit: 10 });
    expect(result.data[0].totalStudents).toBe(18);
    expect(result.meta.total).toBe(1);
  });
});
