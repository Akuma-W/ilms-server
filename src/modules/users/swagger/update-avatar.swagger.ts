import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { UpdateAvatarDto } from '../dto/update-avatar.dto';

export function ApiUpdateAvatar() {
  return applyDecorators(
    ApiOperation({ summary: 'Update user avatar' }),
    ApiBearerAuth(),
    ApiConsumes('multipart/form-data'),
    ApiBody({ type: UpdateAvatarDto }),
    ApiOkResponse({
      schema: {
        example: {
          avatarUrl: 'http://localhost:9000/files/avatars/123abc.png',
        },
      },
    }),
  );
}
