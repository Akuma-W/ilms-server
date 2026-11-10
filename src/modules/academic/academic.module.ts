import { Module } from '@nestjs/common';
import { ClassesModule } from './classes/classes.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { SchoolsModule } from './schools/schools.module';

@Module({
  imports: [ClassesModule, EnrollmentsModule, SchoolsModule],
  exports: [ClassesModule, EnrollmentsModule, SchoolsModule],
})
export class AcademicModule {}
