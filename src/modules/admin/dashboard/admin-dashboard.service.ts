import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { Role, SchoolStatus, UserStatus } from 'src/generated/prisma/enums';
import { AdminOverviewEntity } from './entities/admin-overview.entity';
import { AdminGrowthEntity } from './entities/admin-growth.entity';
import { TopSchoolEntity } from './entities/top-school.entity';
import { RecentActivityEntity } from './entities/recent-activity.entity';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  // Computes aggregate system counters across users, schools, classes, and quizzes
  async getOverview(): Promise<AdminOverviewEntity> {
    const [
      totalUsers,
      totalStudents,
      totalTeachers,
      totalAdmins,
      lockedUsers,
      totalSchools,
      activeSchools,
      totalClasses,
      activeClasses,
      archivedClasses,
      totalEnrollments,
      totalQuizzes,
      publicQuizzes,
      totalAttempts,
      totalAIRequests,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: Role.student } }),
      this.prisma.user.count({ where: { role: Role.teacher } }),
      this.prisma.user.count({ where: { role: Role.admin } }),
      this.prisma.user.count({
        where: { status: { in: [UserStatus.locked, UserStatus.banned] } },
      }),
      this.prisma.school.count(),
      this.prisma.school.count({ where: { status: SchoolStatus.active } }),
      this.prisma.class.count(),
      this.prisma.class.count({ where: { isArchived: false } }),
      this.prisma.class.count({ where: { isArchived: true } }),
      this.prisma.enrollment.count({ where: { roleIn: Role.student } }),
      this.prisma.quiz.count(),
      this.prisma.quiz.count({ where: { visibility: 'public' } }),
      this.prisma.quizAttempt.count(),
      this.prisma.aIRequest.count(),
    ]);

    return {
      totalUsers,
      totalStudents,
      totalTeachers,
      totalAdmins,
      lockedUsers,
      totalSchools,
      activeSchools,
      inactiveSchools: Math.max(0, totalSchools - activeSchools),
      totalClasses,
      activeClasses,
      archivedClasses,
      totalEnrollments,
      totalQuizzes,
      publicQuizzes,
      privateQuizzes: Math.max(0, totalQuizzes - publicQuizzes),
      totalAttempts,
      totalAIRequests,
    };
  }

  // Computes daily registration and engagement metrics for the last 7 calendar days
  async getGrowth(): Promise<AdminGrowthEntity[]> {
    const days = 7;
    const now = new Date();
    const dates: { startOfDay: Date; endOfDay: Date; dateStr: string }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const startOfDay = new Date(d);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(d);
      endOfDay.setHours(23, 59, 59, 999);

      dates.push({ startOfDay, endOfDay, dateStr });
    }

    const growthMetrics = await Promise.all(
      dates.map(async ({ startOfDay, endOfDay, dateStr }) => {
        const [newUsers, newClasses, quizAttempts] = await Promise.all([
          this.prisma.user.count({
            where: { createdAt: { gte: startOfDay, lte: endOfDay } },
          }),
          this.prisma.class.count({
            where: { createdAt: { gte: startOfDay, lte: endOfDay } },
          }),
          this.prisma.quizAttempt.count({
            where: { startedAt: { gte: startOfDay, lte: endOfDay } },
          }),
        ]);

        return {
          date: dateStr,
          newUsers,
          newClasses,
          quizAttempts,
        };
      }),
    );

    return growthMetrics;
  }

  // Identifies top active educational institutions ranked by volume of classrooms and students
  async getTopSchools(limit = 5): Promise<TopSchoolEntity[]> {
    const schools = await this.prisma.school.findMany({
      take: limit,
      orderBy: { classes: { _count: 'desc' } },
      select: {
        id: true,
        name: true,
        shortname: true,
        status: true,
        _count: {
          select: {
            classes: true,
            users: true,
          },
        },
      },
    });

    const topSchools = await Promise.all(
      schools.map(async (school) => {
        const [studentCount, teacherCount] = await Promise.all([
          this.prisma.user.count({
            where: { schoolId: school.id, role: Role.student },
          }),
          this.prisma.user.count({
            where: { schoolId: school.id, role: Role.teacher },
          }),
        ]);

        const totalClasses = school._count.classes;
        // Manually activity score bar
        const activityScore = totalClasses * 10 + studentCount * 2;

        return {
          id: school.id,
          name: school.name,
          shortname: school.shortname,
          totalStudents: studentCount,
          totalTeachers: teacherCount,
          totalClasses,
          status: school.status,
          activityScore,
        };
      }),
    );

    return topSchools;
  }

  // Gathers recent operational activities from classroom creation and user registration events
  async getRecentActivities(limit = 8): Promise<RecentActivityEntity[]> {
    const [recentClasses, recentUsers] = await Promise.all([
      this.prisma.class.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          createdAt: true,
          teacher: { select: { fullName: true } },
        },
      }),
      this.prisma.user.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          role: true,
          createdAt: true,
        },
      }),
    ]);

    const classActivities = recentClasses.map((c) => ({
      id: `class-${c.id}`,
      type: 'class_created',
      description: `Lớp học "${c.title}" đã được tạo bởi ${c.teacher.fullName}`,
      actorName: c.teacher.fullName,
      createdAt: c.createdAt || new Date(),
    }));

    const userActivities = recentUsers.map((u) => ({
      id: `user-${u.id}`,
      type: 'user_registered',
      description: `Người dùng ${u.fullName} (${u.role}) đã tạo tài khoản`,
      actorName: u.fullName,
      createdAt: u.createdAt || new Date(),
    }));

    return [...classActivities, ...userActivities]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, limit);
  }
}
