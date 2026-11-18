import { PartialType } from '@nestjs/swagger';
import { CreateAdminSchoolDto } from './create-admin-school.dto';

export class UpdateAdminSchoolDto extends PartialType(CreateAdminSchoolDto) {}
