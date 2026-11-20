import { Module } from '@nestjs/common';
import { CategoriesController } from './categories/categories.controller';
import { CategoriesService } from './categories/categories.service';
import { GradebookController } from './gradebook/gradebook.controller';
import { GradebookService } from './gradebook/gradebook.service';
import { CalculationsController } from './calculations/calculations.controller';
import { CalculationsService } from './calculations/calculations.service';

@Module({
  controllers: [
    CategoriesController,
    GradebookController,
    CalculationsController,
  ],
  providers: [CategoriesService, GradebookService, CalculationsService],
  exports: [CategoriesService, GradebookService, CalculationsService],
})
export class GradingModule {}
