import { ApiOperation, ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { LoginDto } from '../dto/login.dto';
import { applyDecorators } from '@nestjs/common';

export function ApiLogin() {
  return applyDecorators(
    ApiOperation({
      summary: 'Login account by email and password',
    }),
    ApiBody({
      type: LoginDto,
    }),
    ApiOkResponse({
      description: 'Login successful',
    }),
  );
}
