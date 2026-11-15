import { Module } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { EnrollmentsController } from './enrollments.controller';
import { ClassMembersController } from './members/class-members.controller';
import { ClassMembersService } from './members/class-members.service';
import { StorageModule } from 'src/infrastructures/storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [EnrollmentsController, ClassMembersController],
  providers: [EnrollmentsService, ClassMembersService],
  exports: [EnrollmentsService, ClassMembersService],
})
export class EnrollmentsModule {}
