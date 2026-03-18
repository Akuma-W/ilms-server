import { ApiConsumes } from '@nestjs/swagger';

export function ApiMultipart() {
  return ApiConsumes('multipart/form-data');
}
