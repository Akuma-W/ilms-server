import { BadRequestException } from '@nestjs/common';

export function validateAvatar(file: Express.Multer.File) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];

  if (!allowed.includes(file.mimetype)) {
    throw new BadRequestException('Invalid avatar format');
  }
}
