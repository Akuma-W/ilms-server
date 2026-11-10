import { Module } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { EnrollmentsController } from './enrollments.controller';
import { ClassMembersController } from './members/class-members.controller';
import { ClassMembersService } from './members/class-members.service';

@Module({
  controllers: [EnrollmentsController, ClassMembersController],
  providers: [EnrollmentsService, ClassMembersService],
  exports: [EnrollmentsService, ClassMembersService],
})
export class EnrollmentsModule {}
