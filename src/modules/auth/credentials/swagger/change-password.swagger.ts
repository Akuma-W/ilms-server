import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { ChangePasswordDto } from '../dto/change-password.dto';

export function ApiChangePassword() {
  return applyDecorators(
    ApiOperation({
      summary: 'Change password for authenticated user and invalidate sessions',
    }),
    ApiBearerAuth(),
    ApiBody({
      type: ChangePasswordDto,
    }),
    ApiResponse({
      status: 200,
      description: 'Password changed successfully',
      schema: {
        example: {
          success: true,
          message: 'Password changed successfully',
          data: null,
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Old password is incorrect or new password identical to old',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized access',
    }),
  );
}
