import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { AuthUser } from 'src/modules/auth/session/interfaces/auth-user.interface';
import { multerConfig } from 'src/config/multer.config';
import {
  ApiGetProfile,
  ApiGetProfileClasses,
  ApiUpdateAvatar,
  ApiUpdateProfile,
} from './swagger';

@ApiTags('Profile')
@ApiBearerAuth('access-token')
@Controller('users')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // Retrieves authenticated user personal profile
  @Get('me')
  @ApiGetProfile()
  getProfile(@CurrentUser() user: AuthUser) {
    return this.profileService.getProfile(user.id);
  }

  // Retrieves classes for current user profile with learning metrics
  @Get('me/classes')
  @ApiGetProfileClasses()
  getProfileClasses(@CurrentUser() user: AuthUser) {
    return this.profileService.getProfileClasses(user.id, user.role);
  }

  // Updates authenticated user profile details
  @Patch('me/profile')
  @ApiUpdateProfile()
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(user.id, updateProfileDto);
  }

  // Uploads authenticated user avatar image to storage
  @Patch('me/avatar')
  @ApiUpdateAvatar()
  @UseInterceptors(FileInterceptor('avatar', multerConfig))
  async updateAvatar(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthUser,
  ) {
    if (!file) {
      throw new BadRequestException('Avatar file is required');
    }

    return this.profileService.updateAvatar(user.id, file);
  }
}
