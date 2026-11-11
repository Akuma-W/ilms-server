import { PartialType } from '@nestjs/swagger';
import { CreateGradeCategoryDto } from './create-grade-category.dto';

export class UpdateGradeCategoryDto extends PartialType(
  CreateGradeCategoryDto,
) {}
