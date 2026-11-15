import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { StorageModule } from 'src/infrastructures/storage/storage.module';
import { AdminUserModule } from './admin/admin.module';
import { ProfileModule } from './profile/profile.module';

@Module({
  imports: [StorageModule, AdminUserModule, ProfileModule],
  controllers: [],
  providers: [UsersService],
  exports: [UsersService, AdminUserModule, ProfileModule],
})
export class UsersModule {}
