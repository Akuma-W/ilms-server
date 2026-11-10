import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOperation } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { CreateReferenceDto } from '../dto/create-reference.dto';
import { ReferenceEntity } from '../entities/reference.entity';

export function ApiCreateReference() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create new reference document or link under a topic',
    }),
    ApiAuth(),
    ApiBody({ type: CreateReferenceDto }),
    ApiCreatedResponse({
      description: 'Reference created successfully',
      type: ReferenceEntity,
    }),
  );
}
