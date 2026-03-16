import { randomUUID } from 'crypto';
import { extname } from 'path';

export function generateFileName(file: Express.Multer.File) {
  const ext = extname(file.originalname);
  return `${randomUUID()}${ext}`;
}
