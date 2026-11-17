import { Module } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { ClassesController } from './classes.controller';
import { UsersModule } from 'src/modules/users/users.module';
import { StorageModule } from 'src/infrastructures/storage/storage.module';

@Module({
  imports: [UsersModule, StorageModule],
  controllers: [ClassesController],
  providers: [ClassesService],
})
export class ClassesModule {}
