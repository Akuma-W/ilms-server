import { Test, TestingModule } from '@nestjs/testing';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { Role } from 'src/generated/prisma/enums';
import { AuthUser } from 'src/modules/auth/session/interfaces/auth-user.interface';

describe('ClassesController', () => {
  let controller: ClassesController;

  const classesServiceMock = {
    createByTeacher: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByCourseCode: jest.fn(),
    findMyTeachingClasses: jest.fn(),
    update: jest.fn(),
    archiveClass: jest.fn(),
    unarchiveClass: jest.fn(),
    remove: jest.fn(),
  };

  const prismaMock = {
    class: {
      findUnique: jest.fn(),
    },
    enrollment: {
      findFirst: jest.fn(),
    },
  };

  const mockUser: AuthUser = {
    id: 'teacher-uuid-1',
    jti: 'teacher@test.com',
    role: Role.teacher,
    exp: Math.floor(60 * 60),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClassesController],
      providers: [
        {
          provide: ClassesService,
          useValue: classesServiceMock,
        },
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    controller = module.get<ClassesController>(ClassesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a class by teacher', async () => {
    const dto = {
      title: 'Web Dev',
      subjectId: 'subject-uuid-1',
      isPrivate: false,
    };
    const expected = { id: 'class-uuid-1', ...dto };
    classesServiceMock.createByTeacher.mockResolvedValue(expected);

    const result = await controller.create(mockUser.id, dto);

    expect(classesServiceMock.createByTeacher).toHaveBeenCalledWith(
      mockUser.id,
      dto,
    );
    expect(result).toEqual({
      message: 'Create class successful',
      data: expected,
    });
  });

  it('should find all classes', async () => {
    const query = { page: 1, limit: 10 };
    const expected = {
      data: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 1 },
    };
    classesServiceMock.findAll.mockResolvedValue(expected);

    const result = await controller.findAll(mockUser.id, query);

    expect(classesServiceMock.findAll).toHaveBeenCalledWith(mockUser.id, query);
    expect(result).toEqual({
      message: 'Get classes successful',
      data: expected,
    });
  });

  it('should find one class by id', async () => {
    const expected = {
      id: 'class-uuid-1',
      title: 'Web Dev',
      totalStudents: 10,
    };
    classesServiceMock.findOne.mockResolvedValue(expected);

    const result = await controller.findOne('class-uuid-1');

    expect(classesServiceMock.findOne).toHaveBeenCalledWith('class-uuid-1');
    expect(result).toEqual(expected);
  });

  it('should find class by course code', async () => {
    const expected = {
      id: 'class-uuid-1',
      courseCode: 'ABC123',
      totalStudents: 10,
    };
    classesServiceMock.findByCourseCode.mockResolvedValue(expected);

    const result = await controller.getClassByCourseCode('ABC123');

    expect(classesServiceMock.findByCourseCode).toHaveBeenCalledWith('ABC123');
    expect(result).toEqual(expected);
  });

  it('should find classes taught by current teacher', async () => {
    const query = { page: 1, limit: 10 };
    const expected = {
      data: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 1 },
    };
    classesServiceMock.findMyTeachingClasses.mockResolvedValue(expected);

    const result = await controller.getMyTeachingClasses(mockUser.id, query);

    expect(classesServiceMock.findMyTeachingClasses).toHaveBeenCalledWith(
      mockUser.id,
      query,
    );
    expect(result).toEqual({
      message: 'Get classes successful',
      data: expected,
    });
  });

  it('should update a class', async () => {
    const dto = { title: 'Updated Title' };
    classesServiceMock.update.mockResolvedValue({
      message: 'Class updated successfully',
    });

    const result = await controller.update(mockUser, 'class-uuid-1', dto);

    expect(classesServiceMock.update).toHaveBeenCalledWith(
      mockUser,
      'class-uuid-1',
      dto,
    );
    expect(result).toEqual({ message: 'Class updated successfully' });
  });

  it('should archive a class', async () => {
    classesServiceMock.archiveClass.mockResolvedValue({
      message: 'Class archived successfully',
    });

    const result = await controller.archiveClass(mockUser, 'class-uuid-1');

    expect(classesServiceMock.archiveClass).toHaveBeenCalledWith(
      mockUser,
      'class-uuid-1',
    );
    expect(result).toEqual({ message: 'Class archived successfully' });
  });

  it('should unarchive a class', async () => {
    classesServiceMock.unarchiveClass.mockResolvedValue({
      message: 'Class unarchived successfully',
    });

    const result = await controller.unarchiveClass(mockUser, 'class-uuid-1');

    expect(classesServiceMock.unarchiveClass).toHaveBeenCalledWith(
      mockUser,
      'class-uuid-1',
    );
    expect(result).toEqual({ message: 'Class unarchived successfully' });
  });

  it('should delete a class', async () => {
    classesServiceMock.remove.mockResolvedValue({
      message: 'Class deleted successfully',
    });

    const result = await controller.remove(mockUser, 'class-uuid-1');

    expect(classesServiceMock.remove).toHaveBeenCalledWith(
      mockUser,
      'class-uuid-1',
    );
    expect(result).toEqual({ message: 'Class deleted successfully' });
  });
});
