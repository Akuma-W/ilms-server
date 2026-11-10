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

@ApiTags('Class Members')
@Controller('classes/:classId')
export class ClassMembersController {
  constructor(private readonly membersService: ClassMembersService) {}

  // Get all members for the specified class
  @Get('members')
  @ApiGetClassMembers()
  async getMembers(
    @CurrentUser('id') currentUserId: string,
    @Param('classId', new ParseUUIDPipe()) classId: string,
  ) {
    const data = await this.membersService.getMembers(currentUserId, classId);
    return {
      message: 'Get class members successful',
      data,
    };
  }

  // Approve a pending enrollment request
  @Post(['enrollments/:memberId/approve', 'members/:memberId/approve'])
  @Roles(Role.teacher, Role.admin)
  @ApiApproveMember()
  async approveMember(
    @CurrentUser('id') currentUserId: string,
    @Param('classId', new ParseUUIDPipe()) classId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.membersService.approveMember(currentUserId, classId, memberId);
  }

  // Reject a pending enrollment request
  @Post(['enrollments/:memberId/reject', 'members/:memberId/reject'])
  @Roles(Role.teacher, Role.admin)
  @ApiRejectMember()
  async rejectMember(
    @CurrentUser('id') currentUserId: string,
    @Param('classId', new ParseUUIDPipe()) classId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.membersService.rejectMember(currentUserId, classId, memberId);
  }

  // Remove a member from class
  @Delete('members/:memberId')
  @Roles(Role.teacher, Role.admin)
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
  @ApiUpdateMemberRole()
  async updateMemberRole(
    @CurrentUser('id') currentUserId: string,
    @Param('classId', new ParseUUIDPipe()) classId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.membersService.updateMemberRole(
      currentUserId,
      classId,
      memberId,
      dto.role,
    );
  }
}
