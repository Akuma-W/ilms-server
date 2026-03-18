import { ApiBearerAuth } from '@nestjs/swagger';

export function ApiAuth() {
  return ApiBearerAuth('access-token');
}
