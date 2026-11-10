import { Module } from '@nestjs/common';
import { AssignmentsModule } from './assignments/assignments.module';
import { SubmissionsModule } from './submissions/submissions.module';

@Module({
  imports: [AssignmentsModule, SubmissionsModule],
  exports: [AssignmentsModule, SubmissionsModule],
})
export class AssignModule {}
