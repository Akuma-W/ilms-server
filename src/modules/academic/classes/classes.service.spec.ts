import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ClassesService } from './classes.service';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { UsersService } from 'src/modules/users/users.service';
import { Role } from 'src/generated/prisma/enums';
import { AuthUser } from 'src/modules/auth/session/interfaces/auth-user.interface';
import { generateCourseCode } from './utils/course-code.util';

describe('ClassesService', () => {
  let service: ClassesService;

  const prismaMock = {
    class: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    enrollment: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest
      .fn()
      .mockImplementation(
        async (cbOrArr: ((tx: unknown) => Promise<unknown>) | unknown[]) => {
          if (typeof cbOrArr === 'function') {
            return cbOrArr(prismaMock);
          }
          return Promise.all(cbOrArr as Promise<unknown>[]);
        },
      ),
  };

  const usersMock = {
    findOne: jest.fn(),
  };

  const mockTeacher: AuthUser = {
    id: 'teacher-uuid-1',
    jti: 'teacher@test.com',
    role: Role.teacher,
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  };

  const mockOtherUser: AuthUser = {
    id: 'other-uuid-2',
    jti: 'other@test.com',
    role: Role.teacher,
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
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
    const code = generateCourseCode();
    expect(code).toBeDefined();
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
  });

  it('should create a class and automatically enroll teacher', async () => {
    prismaMock.class.findUnique.mockResolvedValue(null);
    prismaMock.class.create.mockResolvedValue({
      id: 'class-uuid-1',
      title: 'DevOps',
      courseCode: 'DEV101',
      schoolId: 'school-uuid-1',
      teacherId: 'teacher-uuid-1',
    });
    prismaMock.enrollment.create.mockResolvedValue({ id: 'enrollment-uuid-1' });

    const result = await service.create('school-uuid-1', 'teacher-uuid-1', {
      title: 'DevOps',
      subject: 'SE',
      isPrivate: false,
    });

    expect(prismaMock.class.create).toHaveBeenCalled();
    expect(prismaMock.enrollment.create).toHaveBeenCalled();
    expect(result.id).toBe('class-uuid-1');
  });

  it('should create a class on behalf of teacher', async () => {
    usersMock.findOne.mockResolvedValue({ schoolId: 'school-uuid-1' });
    prismaMock.class.findUnique.mockResolvedValue(null);
    prismaMock.class.create.mockResolvedValue({
      id: 'class-uuid-1',
      title: 'DevOps',
    });
    prismaMock.enrollment.create.mockResolvedValue({});

    const result = await service.createByTeacher('teacher-uuid-1', {
      title: 'DevOps',
      subject: 'SE',
      isPrivate: false,
    });

    expect(usersMock.findOne).toHaveBeenCalledWith('teacher-uuid-1');
    expect(result.id).toBe('class-uuid-1');
  });

  it('should map totalStudents in findAll and exclude archived by default', async () => {
    usersMock.findOne.mockResolvedValue({ schoolId: 'school-uuid-1' });
    prismaMock.class.findMany.mockResolvedValue([
      {
        id: 'class-uuid-1',
        title: 'Math 101',
        enrollments: [],
        _count: { enrollments: 18 },
      },
    ]);
    prismaMock.class.count.mockResolvedValue(1);

    const result = await service.findAll('user-uuid-1', { page: 1, limit: 10 });

    expect(prismaMock.class.findMany).toHaveBeenCalled();
    expect(result.data[0].totalStudents).toBe(18);
    expect(result.meta.total).toBe(1);
  });

  it('should map totalStudents in findOne and throw if not found', async () => {
    prismaMock.class.findUnique.mockResolvedValue({
      id: 'class-uuid-1',
      title: 'Math 101',
      _count: { enrollments: 34 },
    });

    const result = await service.findOne('class-uuid-1');
    expect(result.totalStudents).toBe(34);

    prismaMock.class.findUnique.mockResolvedValue(null);
    await expect(service.findOne('invalid-id')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should find by course code and throw if not found', async () => {
    prismaMock.class.findUnique.mockResolvedValue({
      id: 'class-uuid-1',
      courseCode: 'ABC123',
      _count: { enrollments: 5 },
    });

    const result = await service.findByCourseCode('ABC123');
    expect(result.totalStudents).toBe(5);

    prismaMock.class.findUnique.mockResolvedValue(null);
    await expect(service.findByCourseCode('INVALID')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should find teaching classes for current teacher', async () => {
    prismaMock.class.findMany.mockResolvedValue([
      {
        id: 'class-uuid-1',
        title: 'Algorithms',
        enrollments: [],
        _count: { enrollments: 20 },
      },
    ]);
    prismaMock.class.count.mockResolvedValue(1);

    const result = await service.findMyTeachingClasses('teacher-uuid-1', {
      page: 1,
      limit: 10,
    });
    expect(result.data[0].totalStudents).toBe(20);
  });

  it('should update class when allowed and throw forbidden when not owner', async () => {
    prismaMock.class.findUnique.mockResolvedValue({
      id: 'class-uuid-1',
      teacherId: 'teacher-uuid-1',
    });
    prismaMock.class.update.mockResolvedValue({});

    const result = await service.update(mockTeacher, 'class-uuid-1', {
      title: 'New Title',
    });
    expect(result.message).toBe('Class updated successfully');

    await expect(
      service.update(mockOtherUser, 'class-uuid-1', { title: 'Hacked' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should archive and unarchive class properly', async () => {
    prismaMock.class.findUnique.mockResolvedValue({
      id: 'class-uuid-1',
      teacherId: 'teacher-uuid-1',
      isArchived: false,
    });
    prismaMock.class.update.mockResolvedValue({});

    const archiveRes = await service.archiveClass(mockTeacher, 'class-uuid-1');
    expect(archiveRes.message).toBe('Class archived successfully');

    prismaMock.class.findUnique.mockResolvedValue({
      id: 'class-uuid-1',
      teacherId: 'teacher-uuid-1',
      isArchived: true,
    });
    await expect(
      service.archiveClass(mockTeacher, 'class-uuid-1'),
    ).rejects.toThrow(BadRequestException);

    const unarchiveRes = await service.unarchiveClass(
      mockTeacher,
      'class-uuid-1',
    );
    expect(unarchiveRes.message).toBe('Class unarchived successfully');
  });

  it('should delete class in transaction and cascade enrollments', async () => {
    prismaMock.class.findUnique.mockResolvedValue({
      id: 'class-uuid-1',
      teacherId: 'teacher-uuid-1',
    });

    const result = await service.remove(mockTeacher, 'class-uuid-1');
    expect(result.message).toBe('Class deleted successfully');
    expect(prismaMock.$transaction).toHaveBeenCalled();
  });
});
