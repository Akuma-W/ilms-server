import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { UpdateMaterialDto } from '../dto/update-material.dto';
import { MaterialEntity } from '../entities/material.entity';

export function ApiUpdateMaterial() {
  return applyDecorators(
    ApiOperation({ summary: 'Update learning material metadata' }),
    ApiAuth(),
    ApiBody({ type: UpdateMaterialDto }),
    ApiOkResponse({
      description: 'Material updated successfully',
      type: MaterialEntity,
    }),
  );
}
