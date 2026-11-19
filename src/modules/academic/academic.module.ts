import { Module } from '@nestjs/common';
import { ClassesModule } from './classes/classes.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { SchoolsModule } from './schools/schools.module';
import { SubjectsModule } from './subjects/subjects.module';
import { GradingModule } from './grading/grading.module';
import { MeetingsModule } from './meetings/meetings.module';

@Module({
  imports: [
    ClassesModule,
    EnrollmentsModule,
    SchoolsModule,
    SubjectsModule,
    GradingModule,
    MeetingsModule,
  ],
  exports: [
    ClassesModule,
    EnrollmentsModule,
    SchoolsModule,
    SubjectsModule,
    GradingModule,
    MeetingsModule,
  ],
})
export class AcademicModule {}
