import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOperation } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { CreateMaterialDto } from '../dto/create-material.dto';
import { MaterialEntity } from '../entities/material.entity';

export function ApiCreateMaterial() {
  return applyDecorators(
    ApiOperation({ summary: 'Create new learning material under a topic' }),
    ApiAuth(),
    ApiBody({ type: CreateMaterialDto }),
    ApiCreatedResponse({
      description: 'Material created successfully',
      type: MaterialEntity,
    }),
  );
}
