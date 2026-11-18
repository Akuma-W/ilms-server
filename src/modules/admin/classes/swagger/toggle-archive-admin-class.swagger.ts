import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminClassEntity } from '../entities/admin-class.entity';

export function ApiToggleArchiveAdminClass() {
  return applyDecorators(
    ApiOperation({
      summary: 'Archive or unarchive classroom as administrator',
      description:
        'Toggles read-only archive status to preserve or resume classroom operations',
    }),
    ApiOkResponse({
      description: 'Updated classroom entity with new archive state',
      type: AdminClassEntity,
    }),
    ApiResponse({ status: 404, description: 'Classroom not found' }),
  );
}
