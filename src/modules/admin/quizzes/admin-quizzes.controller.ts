import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/generated/prisma/enums';
import { JwtAuthGuard } from 'src/modules/auth/session/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { AdminQuizzesService } from './admin-quizzes.service';
import { QueryAdminQuizzesDto } from './dto/query-admin-quizzes.dto';
import { TakedownQuizDto } from './dto/takedown-quiz.dto';
import {
  ApiForceDeleteAdminQuiz,
  ApiGetAdminQuiz,
  ApiGetAdminQuizzes,
  ApiTakedownAdminQuiz,
} from './swagger';

@ApiTags('Admin - Quizzes')
@ApiAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.admin)
@Controller('admin/quizzes')
export class AdminQuizzesController {
  constructor(private readonly quizzesService: AdminQuizzesService) {}

  // Lists all quizzes across platform with filter by visibility, status and author
  @Get()
  @ApiGetAdminQuizzes()
  async findAll(@Query() query: QueryAdminQuizzesDto) {
    const data = await this.quizzesService.findAll(query);
    return {
      message: 'Get quizzes successful',
      data,
    };
  }

  // Retrieves unmasked quiz examination questions and answers for audit
  @Get(':id')
  @ApiGetAdminQuiz()
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.quizzesService.findOne(id);
    return {
      message: 'Get quiz successful',
      data,
    };
  }

  // Revokes public visibility and switches quiz to draft due to copyright violation
  @Patch(':id/takedown')
  @ApiTakedownAdminQuiz()
  async takedown(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TakedownQuizDto,
  ) {
    const data = await this.quizzesService.takedown(id, dto);
    return {
      message: 'Takedown quiz successful',
      data,
    };
  }

  // Permanently force deletes copyright-infringing quiz from system
  @Delete(':id')
  @ApiForceDeleteAdminQuiz()
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('reason') reason?: string,
  ) {
    return reason !== undefined
      ? this.quizzesService.forceDelete(id, reason)
      : this.quizzesService.forceDelete(id);
  }
}
