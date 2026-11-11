import { Module } from '@nestjs/common';
import { GradeCategoriesModule } from '../grade-categories/grade-categories.module';
import { GradesController } from './grades.controller';
import { GradesService } from './grades.service';

@Module({
  imports: [GradeCategoriesModule],
  controllers: [GradesController],
  providers: [GradesService],
  exports: [GradesService],
})
export class GradesModule {}
