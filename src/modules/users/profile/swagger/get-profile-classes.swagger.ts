import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ProfileClassEntity } from '../entities/profile-class.entity';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiGetProfileClasses() {
  return applyDecorators(
    ApiOperation({
      summary:
        'Get enrolled or teaching classes for current user profile with learning metrics',
    }),
    ApiAuth(),
    ApiOkResponse({
      description: 'List of classes relevant to the current user profile',
      type: [ProfileClassEntity],
    }),
  );
}
