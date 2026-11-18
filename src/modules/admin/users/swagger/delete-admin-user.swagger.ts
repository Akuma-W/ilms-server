import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiDeleteAdminUser() {
  return applyDecorators(
    ApiOperation({
      summary: 'Soft-delete or ban user account',
      description:
        'Sets user account status to banned preserving academic records; strictly forbids self-deletion by current administrator',
    }),
    ApiOkResponse({
      description: 'Account successfully soft-deleted',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Tài khoản người dùng đã được vô hiệu hóa thành công',
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Cannot delete or ban your own administrator account',
    }),
    ApiResponse({ status: 404, description: 'User not found' }),
  );
}
