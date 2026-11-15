import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { UpdateAvatarDto } from '../dto/update-avatar.dto';

export function ApiUpdateAvatar() {
  return applyDecorators(
    ApiOperation({ summary: 'Update profile avatar' }),
    ApiAuth(),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      description: 'Avatar image file (JPG, PNG, WebP up to 5MB)',
      type: UpdateAvatarDto,
    }),
    ApiResponse({
      status: 200,
      description: 'Avatar updated successfully',
      schema: {
        type: 'object',
        properties: {
          avatarUrl: {
            type: 'string',
            example: 'http://localhost:9000/files/avatars/user-id.png',
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid file or file too large',
    }),
  );
}
