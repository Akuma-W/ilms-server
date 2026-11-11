import { Module } from '@nestjs/common';
import { ClassesModule } from './classes/classes.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { SchoolsModule } from './schools/schools.module';
import { GradeCategoriesModule } from './grade-categories/grade-categories.module';
import { GradesModule } from './grades/grades.module';

@Module({
  imports: [
    ClassesModule,
    EnrollmentsModule,
    SchoolsModule,
    GradeCategoriesModule,
    GradesModule,
  ],
  exports: [
    ClassesModule,
    EnrollmentsModule,
    SchoolsModule,
    GradeCategoriesModule,
    GradesModule,
  ],
})
export class AcademicModule {}
