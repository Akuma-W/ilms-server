import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { StorageModule } from 'src/infrastructures/storage/storage.module';
import { AdminUserModule } from './admin/admin.module';
import { ProfileModule } from './profile/profile.module';

@Module({
  imports: [StorageModule, ProfileModule, AdminUserModule],
  controllers: [],
  providers: [UsersService],
  exports: [UsersService, ProfileModule, AdminUserModule],
})
export class UsersModule {}
