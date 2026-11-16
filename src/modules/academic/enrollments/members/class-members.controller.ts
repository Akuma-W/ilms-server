import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/generated/prisma/enums';
import { ClassMembersService } from './class-members.service';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { ApiGetClassMembers } from './swagger/get-class-members.swagger';
import { ApiApproveMember } from './swagger/approve-member.swagger';
import { ApiRejectMember } from './swagger/reject-member.swagger';
import { ApiRemoveMember } from './swagger/remove-member.swagger';
import { ApiUpdateMemberRole } from './swagger/update-member-role.swagger';
import { ApiBanMember } from './swagger/ban-member.swagger';
import { ApiUnbanMember } from './swagger/unban-member.swagger';
import { ApiReApproveMember } from './swagger/re-approve-member.swagger';
import { ClassTeacherGuard, ClassMemberGuard } from 'src/common/guards';

@ApiTags('Class Members')
@Controller('classes/:classId')
export class ClassMembersController {
  constructor(private readonly membersService: ClassMembersService) {}

  // Get all members for the specified class
  @Get('members')
  @UseGuards(ClassMemberGuard)
  @ApiGetClassMembers()
  async getMembers(@Param('classId', new ParseUUIDPipe()) classId: string) {
    const data = await this.membersService.getMembers(classId);
    return {
      message: 'Get class members successful',
      data,
    };
  }

  // Approve a pending enrollment request
  @Post(['enrollments/:memberId/approve', 'members/:memberId/approve'])
  @Roles(Role.teacher, Role.admin)
  @UseGuards(ClassTeacherGuard)
  @ApiApproveMember()
  async approveMember(
    @Param('classId', new ParseUUIDPipe()) classId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.membersService.approveMember(classId, memberId);
  }

  // Reject a pending enrollment request
  @Post(['enrollments/:memberId/reject', 'members/:memberId/reject'])
  @Roles(Role.teacher, Role.admin)
  @UseGuards(ClassTeacherGuard)
  @ApiRejectMember()
  async rejectMember(
    @Param('classId', new ParseUUIDPipe()) classId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.membersService.rejectMember(classId, memberId);
  }

  // Re-approve a previously rejected enrollment
  @Post(['enrollments/:memberId/re-approve', 'members/:memberId/re-approve'])
  @Roles(Role.teacher, Role.admin)
  @UseGuards(ClassTeacherGuard)
  @ApiReApproveMember()
  async reApproveMember(
    @Param('classId', new ParseUUIDPipe()) classId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.membersService.reApproveMember(classId, memberId);
  }

  // Suspend / ban a member from class
  @Post(['enrollments/:memberId/ban', 'members/:memberId/ban'])
  @Roles(Role.teacher, Role.admin)
  @UseGuards(ClassTeacherGuard)
  @ApiBanMember()
  async banMember(
    @Param('classId', new ParseUUIDPipe()) classId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.membersService.banMember(classId, memberId);
  }

  // Lift suspension / unban a member from class
  @Post(['enrollments/:memberId/unban', 'members/:memberId/unban'])
  @Roles(Role.teacher, Role.admin)
  @UseGuards(ClassTeacherGuard)
  @ApiUnbanMember()
  async unbanMember(
    @Param('classId', new ParseUUIDPipe()) classId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.membersService.unbanMember(classId, memberId);
  }

  // Remove a member from class
  @Delete('members/:memberId')
  @Roles(Role.teacher, Role.admin)
  @UseGuards(ClassTeacherGuard)
  @ApiRemoveMember()
  async removeMember(
    @CurrentUser('id') currentUserId: string,
    @Param('classId', new ParseUUIDPipe()) classId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.membersService.removeMember(currentUserId, classId, memberId);
  }

  // Update a member role in the class
  @Patch('members/:memberId/role')
  @Roles(Role.teacher, Role.admin)
  @UseGuards(ClassTeacherGuard)
  @ApiUpdateMemberRole()
  async updateMemberRole(
    @Param('classId', new ParseUUIDPipe()) classId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.membersService.updateMemberRole(classId, memberId, dto.role);
  }
}
