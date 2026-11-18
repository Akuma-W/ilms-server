import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/generated/prisma/enums';
import { JwtAuthGuard } from 'src/modules/auth/session/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AdminDashboardService } from './admin-dashboard.service';
import {
  ApiGetDashboardActivities,
  ApiGetDashboardGrowth,
  ApiGetDashboardOverview,
  ApiGetDashboardTopSchools,
} from './swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { AdminOverviewEntity } from './entities/admin-overview.entity';
import { AdminGrowthEntity } from './entities/admin-growth.entity';
import { TopSchoolEntity } from './entities/top-school.entity';
import { RecentActivityEntity } from './entities/recent-activity.entity';

@ApiTags('Admin - Dashboard')
@ApiAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.admin)
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  // Retrieves high-level platform count metrics across users, schools, classrooms, and quizzes
  @Get('overview')
  @ApiGetDashboardOverview()
  async getOverview(): Promise<{ message: string; data: AdminOverviewEntity }> {
    const data = await this.dashboardService.getOverview();
    return {
      message: 'Get dashboard overview successful',
      data,
    };
  }

  // Retrieves 7-day chronological daily metrics for new users, classes and quiz attempts
  @Get('growth')
  @ApiGetDashboardGrowth()
  async getGrowth(): Promise<{ message: string; data: AdminGrowthEntity[] }> {
    const data = await this.dashboardService.getGrowth();
    return {
      message: 'Get dashboard growth metrics successful',
      data,
    };
  }

  // Retrieves the most active educational institutions ranked by classroom scale and student population
  @Get('top-schools')
  @ApiGetDashboardTopSchools()
  async getTopSchools(): Promise<{ message: string; data: TopSchoolEntity[] }> {
    const data = await this.dashboardService.getTopSchools();
    return {
      message: 'Get top schools leaderboard successful',
      data,
    };
  }

  // Retrieves chronological log of recent high-value events such as class creation and user registrations
  @Get('activities')
  @ApiGetDashboardActivities()
  async getActivities(): Promise<{
    message: string;
    data: RecentActivityEntity[];
  }> {
    const data = await this.dashboardService.getRecentActivities();
    return {
      message: 'Get recent activities successful',
      data,
    };
  }
}
