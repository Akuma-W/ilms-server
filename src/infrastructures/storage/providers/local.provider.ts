import { Injectable } from '@nestjs/common';
import { StorageProvider } from '../interfaces/storage-provider.interface';
import { promises as fs } from 'fs';
import { join } from 'path';
import { generateFileName } from '../utils/file.util';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private basePath = join(process.cwd(), 'uploads');

  async upload(file: Express.Multer.File, folder: string): Promise<string> {
    const fileName = generateFileName(file);
    const folderPath = join(this.basePath, folder);

    await fs.mkdir(folderPath, { recursive: true });

    const filePath = join(folderPath, fileName);

    await fs.writeFile(filePath, file.buffer);

    return `${folder}/${fileName}`;
  }

  async uploadMany(
    files: Express.Multer.File[],
    folder: string,
  ): Promise<string[]> {
    const results: string[] = [];

    for (const file of files) {
      const path = await this.upload(file, folder);
      results.push(path);
    }

    return results;
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = join(this.basePath, filePath);

    await fs.unlink(fullPath);
  }

  getFileUrl(filePath: string): string {
    return `/uploads/${filePath}`;
  }
}
