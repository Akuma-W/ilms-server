import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { Role, SchoolStatus } from 'src/generated/prisma/enums';
import { AdminDashboardService } from './admin-dashboard.service';

describe('AdminDashboardService', () => {
  let service: AdminDashboardService;

  const mockPrismaService = {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    school: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    class: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    enrollment: {
      count: jest.fn(),
    },
    quiz: {
      count: jest.fn(),
    },
    quizAttempt: {
      count: jest.fn(),
    },
    aIRequest: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminDashboardService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AdminDashboardService>(AdminDashboardService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOverview', () => {
    it('should aggregate overview metrics successfully', async () => {
      mockPrismaService.user.count
        .mockResolvedValueOnce(1250) // totalUsers
        .mockResolvedValueOnce(1100) // totalStudents
        .mockResolvedValueOnce(140) // totalTeachers
        .mockResolvedValueOnce(10) // totalAdmins
        .mockResolvedValueOnce(8); // lockedUsers
      mockPrismaService.school.count
        .mockResolvedValueOnce(15) // totalSchools
        .mockResolvedValueOnce(14); // activeSchools
      mockPrismaService.class.count
        .mockResolvedValueOnce(120) // totalClasses
        .mockResolvedValueOnce(105) // activeClasses
        .mockResolvedValueOnce(15); // archivedClasses
      mockPrismaService.enrollment.count.mockResolvedValueOnce(3450);
      mockPrismaService.quiz.count
        .mockResolvedValueOnce(340) // totalQuizzes
        .mockResolvedValueOnce(210); // publicQuizzes
      mockPrismaService.quizAttempt.count.mockResolvedValueOnce(8400);
      mockPrismaService.aIRequest.count.mockResolvedValueOnce(1520);

      const result = await service.getOverview();

      expect(result).toBeDefined();
      expect(result.totalUsers).toBe(1250);
      expect(result.totalStudents).toBe(1100);
      expect(result.totalTeachers).toBe(140);
      expect(result.totalAdmins).toBe(10);
      expect(result.lockedUsers).toBe(8);
      expect(result.totalSchools).toBe(15);
      expect(result.activeSchools).toBe(14);
      expect(result.inactiveSchools).toBe(1);
      expect(result.totalClasses).toBe(120);
      expect(result.activeClasses).toBe(105);
      expect(result.archivedClasses).toBe(15);
      expect(result.totalEnrollments).toBe(3450);
      expect(result.totalQuizzes).toBe(340);
      expect(result.publicQuizzes).toBe(210);
      expect(result.privateQuizzes).toBe(130);
      expect(result.totalAttempts).toBe(8400);
      expect(result.totalAIRequests).toBe(1520);
    });
  });

  describe('getGrowth', () => {
    it('should return 7-day growth metrics', async () => {
      mockPrismaService.user.count.mockResolvedValue(5);
      mockPrismaService.class.count.mockResolvedValue(2);
      mockPrismaService.quizAttempt.count.mockResolvedValue(10);

      const result = await service.getGrowth();

      expect(result).toHaveLength(7);
      expect(result[0].newUsers).toBe(5);
      expect(result[0].newClasses).toBe(2);
      expect(result[0].quizAttempts).toBe(10);
    });
  });

  describe('getTopSchools', () => {
    it('should compute top schools and activity scores', async () => {
      mockPrismaService.school.findMany.mockResolvedValue([
        {
          id: 'school-1',
          name: 'ĐH CNTT',
          shortname: 'UIT',
          status: SchoolStatus.active,
          _count: { classes: 50, users: 640 },
        },
      ]);
      mockPrismaService.user.count
        .mockResolvedValueOnce(600) // studentCount
        .mockResolvedValueOnce(40); // teacherCount

      const result = await service.getTopSchools();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('ĐH CNTT');
      expect(result[0].totalStudents).toBe(600);
      expect(result[0].totalTeachers).toBe(40);
      expect(result[0].totalClasses).toBe(50);
      expect(result[0].activityScore).toBe(50 * 10 + 600 * 2);
    });
  });

  describe('getRecentActivities', () => {
    it('should return combined sorted activities', async () => {
      mockPrismaService.class.findMany.mockResolvedValue([
        {
          id: 'class-1',
          title: 'Nhập môn CNPM',
          createdAt: new Date(),
          teacher: { fullName: 'ThS. Nguyễn Văn A' },
        },
      ]);
      mockPrismaService.user.findMany.mockResolvedValue([
        {
          id: 'user-1',
          fullName: 'Trần Văn B',
          role: Role.student,
          createdAt: new Date(),
        },
      ]);

      const result = await service.getRecentActivities();

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].actorName).toBeDefined();
    });
  });
});
