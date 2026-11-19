import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ClassTeacherGuard } from 'src/common/guards/class-teacher.guard';
import { CategoriesService } from './categories.service';
import { CreateGradeCategoryDto } from './dto/create-grade-category.dto';
import { UpdateGradeCategoryDto } from './dto/update-grade-category.dto';
import { ApiGetGradeCategories } from './swagger/get-grade-categories.swagger';
import { ApiCreateGradeCategory } from './swagger/create-grade-category.swagger';
import { ApiUpdateGradeCategory } from './swagger/update-grade-category.swagger';
import { ApiDeleteGradeCategory } from './swagger/delete-grade-category.swagger';

@ApiTags('Grade Categories')
@Controller('classes/:classId/grades/categories')
@UseGuards(ClassTeacherGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // List all grade categories for a class
  @Get()
  @ApiGetGradeCategories()
  async getCategories(@Param('classId', ParseUUIDPipe) classId: string) {
    return this.categoriesService.getCategories(classId);
  }

  // Create a new grade category
  @Post()
  @ApiCreateGradeCategory()
  async createCategory(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Body() dto: CreateGradeCategoryDto,
  ) {
    return this.categoriesService.createCategory(classId, dto);
  }

  // Update an existing grade category
  @Put(':categoryId')
  @ApiUpdateGradeCategory()
  async updateCategory(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body() dto: UpdateGradeCategoryDto,
  ) {
    return this.categoriesService.updateCategory(classId, categoryId, dto);
  }

  // Delete a grade category
  @Delete(':categoryId')
  @ApiDeleteGradeCategory()
  async deleteCategory(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ) {
    return this.categoriesService.deleteCategory(classId, categoryId);
  }
}
