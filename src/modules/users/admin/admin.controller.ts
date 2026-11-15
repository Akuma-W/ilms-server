import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/generated/prisma/enums';
import {
  ApiCreateAdminUser,
  ApiDeleteUser,
  ApiGetUser,
  ApiGetUsers,
  ApiUpdateAdminUser,
} from './swagger';

@ApiTags('Admin Users')
@ApiBearerAuth('access-token')
@Roles(Role.admin)
@Controller('users')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Creates new user account record by admin
  @Post()
  @ApiCreateAdminUser()
  createAdminUser(@Body() createUserDto: CreateUserDto) {
    return this.adminService.createAdminUser(createUserDto);
  }

  // Lists all user accounts across system for admin
  @Get()
  @ApiGetUsers()
  findAll() {
    return this.adminService.findAll();
  }

  // Retrieves user details by id
  @Get(':id')
  @ApiGetUser()
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.findOne(id);
  }

  // Updates user account properties by admin
  @Patch(':id')
  @ApiUpdateAdminUser()
  updateAdminUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.adminService.updateAdminUser(id, updateUserDto);
  }

  // Deactivates user account (soft delete) by admin
  @Delete(':id')
  @ApiDeleteUser()
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.delete(id);
  }
}
