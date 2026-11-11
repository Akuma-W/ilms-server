import { Module } from '@nestjs/common';
import { GradeCategoriesController } from './grade-categories.controller';
import { GradeCategoriesService } from './grade-categories.service';

@Module({
  controllers: [GradeCategoriesController],
  providers: [GradeCategoriesService],
  exports: [GradeCategoriesService],
})
export class GradeCategoriesModule {}
