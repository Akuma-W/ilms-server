import { Module } from '@nestjs/common';
import { StorageModule } from 'src/infrastructures/storage/storage.module';
import { NotificationModule } from 'src/infrastructures/notification/notification.module';
import { AdminDashboardController } from './dashboard/admin-dashboard.controller';
import { AdminDashboardService } from './dashboard/admin-dashboard.service';
import { AdminSchoolsController } from './schools/admin-schools.controller';
import { AdminSchoolsService } from './schools/admin-schools.service';
import { AdminClassesController } from './classes/admin-classes.controller';
import { AdminClassesService } from './classes/admin-classes.service';
import { AdminQuizzesController } from './quizzes/admin-quizzes.controller';
import { AdminQuizzesService } from './quizzes/admin-quizzes.service';
import { AdminUsersController } from './users/admin-users.controller';
import { AdminUsersService } from './users/admin-users.service';

@Module({
  imports: [StorageModule, NotificationModule],
  controllers: [
    AdminDashboardController,
    AdminSchoolsController,
    AdminClassesController,
    AdminQuizzesController,
    AdminUsersController,
  ],
  providers: [
    AdminDashboardService,
    AdminSchoolsService,
    AdminClassesService,
    AdminQuizzesService,
    AdminUsersService,
  ],
  exports: [
    AdminDashboardService,
    AdminSchoolsService,
    AdminClassesService,
    AdminQuizzesService,
    AdminUsersService,
  ],
})
export class AdminModule {}
