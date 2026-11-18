import { Test, TestingModule } from '@nestjs/testing';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';

describe('AdminDashboardController', () => {
  let controller: AdminDashboardController;

  const mockDashboardService = {
    getOverview: jest.fn(),
    getGrowth: jest.fn(),
    getTopSchools: jest.fn(),
    getRecentActivities: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminDashboardController],
      providers: [
        { provide: AdminDashboardService, useValue: mockDashboardService },
      ],
    }).compile();

    controller = module.get<AdminDashboardController>(AdminDashboardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getOverview', () => {
    it('should return overview stats', async () => {
      const overview = {
        totalUsers: 1250,
        totalStudents: 1100,
        totalTeachers: 140,
        totalAdmins: 10,
        lockedUsers: 8,
        totalSchools: 15,
        activeSchools: 14,
        inactiveSchools: 1,
        totalClasses: 120,
        activeClasses: 105,
        archivedClasses: 15,
        totalEnrollments: 3450,
        totalQuizzes: 340,
        publicQuizzes: 210,
        privateQuizzes: 130,
        totalAttempts: 8400,
        totalAIRequests: 1520,
      };
      mockDashboardService.getOverview.mockResolvedValue(overview);

      const result = await controller.getOverview();
      expect(mockDashboardService.getOverview).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Get dashboard overview successful',
        data: overview,
      });
    });
  });

  describe('getGrowth', () => {
    it('should return growth metrics', async () => {
      const growth = [
        {
          date: '2026-11-17',
          newUsers: 10,
          newClasses: 2,
          quizAttempts: 30,
        },
      ];
      mockDashboardService.getGrowth.mockResolvedValue(growth);

      const result = await controller.getGrowth();
      expect(mockDashboardService.getGrowth).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Get dashboard growth metrics successful',
        data: growth,
      });
    });
  });

  describe('getTopSchools', () => {
    it('should return top schools', async () => {
      const schools = [
        {
          id: 'school-1',
          name: 'School 1',
          shortname: 'S1',
          totalStudents: 100,
          totalTeachers: 10,
          totalClasses: 5,
          status: 'active',
          activityScore: 250,
        },
      ];
      mockDashboardService.getTopSchools.mockResolvedValue(schools);

      const result = await controller.getTopSchools();
      expect(mockDashboardService.getTopSchools).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Get top schools leaderboard successful',
        data: schools,
      });
    });
  });

  describe('getActivities', () => {
    it('should return recent activities', async () => {
      const activities = [
        {
          id: 'act-1',
          type: 'class_created',
          description: 'Lớp học mới',
          actorName: 'GV',
          createdAt: new Date(),
        },
      ];
      mockDashboardService.getRecentActivities.mockResolvedValue(activities);

      const result = await controller.getActivities();
      expect(mockDashboardService.getRecentActivities).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Get recent activities successful',
        data: activities,
      });
    });
  });
});
