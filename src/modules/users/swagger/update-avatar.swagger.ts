import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { UpdateAvatarDto } from '../dto/update-avatar.dto';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiUpdateAvatar() {
  return applyDecorators(
    ApiOperation({ summary: 'Update user avatar' }),
    ApiAuth(),
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
