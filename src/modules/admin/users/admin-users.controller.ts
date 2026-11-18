import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/generated/prisma/enums';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/modules/auth/session/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { AdminUsersService } from './admin-users.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { QueryAdminUsersDto } from './dto/query-admin-users.dto';
import { ResetPasswordAdminUserDto } from './dto/reset-password-admin-user.dto';
import {
  ApiCreateAdminUser,
  ApiDeleteAdminUser,
  ApiGetAdminUser,
  ApiGetAdminUsers,
  ApiResetPasswordAdminUser,
  ApiUpdateAdminUser,
} from './swagger';

@ApiTags('Admin - Users')
@ApiAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.admin)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: AdminUsersService) {}

  // Registers a new user account directly by administrator
  @Post()
  @ApiCreateAdminUser()
  async create(@Body() dto: CreateAdminUserDto) {
    const data = await this.usersService.create(dto);
    return {
      message: 'User created successfully',
      data,
    };
  }

  // Lists all user accounts with pagination, multi-criteria filtering and keyword search
  @Get()
  @ApiGetAdminUsers()
  async findAll(@Query() query: QueryAdminUsersDto) {
    const data = await this.usersService.findAll(query);
    return {
      message: 'Get users successful',
      data,
    };
  }

  // Retrieves user account details by unique identifier
  @Get(':id')
  @ApiGetAdminUser()
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.usersService.findOne(id);
    return {
      message: 'Get user successful',
      data,
    };
  }

  // Updates user profile, role, or status with self-protection enforcement
  @Patch(':id')
  @ApiUpdateAdminUser()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminUserDto,
    @CurrentUser('id') currentAdminId: string,
  ) {
    const data = await this.usersService.update(id, dto, currentAdminId);
    return {
      message: 'User updated successfully',
      data,
    };
  }

  // Resets user password securely and returns temporary credential
  @Post(':id/reset-password')
  @ApiResetPasswordAdminUser()
  async resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResetPasswordAdminUserDto,
  ) {
    const data = await this.usersService.resetPassword(id, dto);
    return {
      message: 'Reset user password successful',
      data,
    };
  }

  // Soft-deletes user account preventing self-deletion by administrator
  @Delete(':id')
  @ApiDeleteAdminUser()
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') currentAdminId: string,
  ) {
    return this.usersService.remove(id, currentAdminId);
  }
}
