import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiResetPasswordAdminUser() {
  return applyDecorators(
    ApiOperation({
      summary: 'Reset user password as administrator',
      description:
        'Generates or applies a new secure password hash for user account; returns generated cleartext credentials once',
    }),
    ApiOkResponse({
      description: 'Password reset result with generated credential',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Mật khẩu đã được đặt lại thành công',
          },
          temporaryPassword: { type: 'string', example: 'Pass@2026!Abc' },
        },
      },
    }),
    ApiResponse({ status: 404, description: 'User not found' }),
  );
}
