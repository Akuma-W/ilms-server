import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { AuthUser } from 'src/modules/auth/session/interfaces/auth-user.interface';
import { GradeCategoriesService } from './grade-categories.service';
import { CreateGradeCategoryDto } from './dto/create-grade-category.dto';
import { UpdateGradeCategoryDto } from './dto/update-grade-category.dto';
import { ApiGetGradeCategories } from './swagger/get-grade-categories.swagger';
import { ApiCreateGradeCategory } from './swagger/create-grade-category.swagger';
import { ApiUpdateGradeCategory } from './swagger/update-grade-category.swagger';
import { ApiDeleteGradeCategory } from './swagger/delete-grade-category.swagger';

@ApiTags('Grade Categories')
@Controller('classes/:classId/grade-categories')
export class GradeCategoriesController {
  constructor(
    private readonly gradeCategoriesService: GradeCategoriesService,
  ) {}

  // List all grade categories for a class
  @Get()
  @ApiGetGradeCategories()
  async getCategories(@Param('classId', ParseUUIDPipe) classId: string) {
    return this.gradeCategoriesService.getCategories(classId);
  }

  // Create a new grade category
  @Post()
  @ApiCreateGradeCategory()
  async createCategory(
    @CurrentUser() user: AuthUser,
    @Param('classId', ParseUUIDPipe) classId: string,
    @Body() dto: CreateGradeCategoryDto,
  ) {
    return this.gradeCategoriesService.createCategory(
      user.id,
      user.role,
      classId,
      dto,
    );
  }

  // Update an existing grade category
  @Put(':categoryId')
  @ApiUpdateGradeCategory()
  async updateCategory(
    @CurrentUser() user: AuthUser,
    @Param('classId', ParseUUIDPipe) classId: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body() dto: UpdateGradeCategoryDto,
  ) {
    return this.gradeCategoriesService.updateCategory(
      user.id,
      user.role,
      classId,
      categoryId,
      dto,
    );
  }

  // Delete a grade category
  @Delete(':categoryId')
  @ApiDeleteGradeCategory()
  async deleteCategory(
    @CurrentUser() user: AuthUser,
    @Param('classId', ParseUUIDPipe) classId: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ) {
    return this.gradeCategoriesService.deleteCategory(
      user.id,
      user.role,
      classId,
      categoryId,
    );
  }
}
