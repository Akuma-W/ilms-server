import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { StorageModule } from 'src/infrastructures/storage/storage.module';
import { ProfileModule } from './profile/profile.module';

@Module({
  imports: [StorageModule, ProfileModule],
  controllers: [],
  providers: [UsersService],
  exports: [UsersService, ProfileModule],
})
export class UsersModule {}
