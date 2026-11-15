import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageProvider } from './interfaces/storage-provider.interface';
import { LocalStorageProvider } from './providers/local.provider';
import { MinioStorageProvider } from './providers/minio.provider';
import { LoggerService } from 'src/logger/logger.service';

@Injectable()
export class StorageService {
  private provider: StorageProvider;

  constructor(
    config: ConfigService,
    local: LocalStorageProvider,
    minio: MinioStorageProvider,
    private logger: LoggerService,
  ) {
    const driver = config.get<string>('storage.driver');
    this.provider = driver === 'minio' ? minio : local;
  }

  // Uploads a single file to target storage directory
  async upload(file: Express.Multer.File, folder: string) {
    this.logger.log(`Uploading file to ${folder}`);
    return this.provider.upload(file, folder);
  }

  // Uploads multiple files in batch to target folder
  async uploadMany(files: Express.Multer.File[], folder: string) {
    return this.provider.uploadMany(files, folder);
  }

  // Deletes file by stored path
  async delete(filePath: string) {
    return this.provider.delete(filePath);
  }

  // Retrieves public accessible URL for stored file path
  async getUrl(filePath: string) {
    return this.provider.getFileUrl(filePath);
  }

  // Resolves avatar image storage path or returns original URL
  async getAvatarUrl(avatarUrl: string | null): Promise<string | null> {
    if (!avatarUrl) return null;
    const cleanPath = avatarUrl.replace(/^\/+/, '');

    if (cleanPath.startsWith('avatars/')) {
      try {
        return await this.getUrl(cleanPath);
      } catch (error: unknown) {
        this.logger.warn(
          `Failed to resolve avatar URL for path: ${cleanPath}`,
          {
            error,
          },
        );
        return avatarUrl;
      }
    }

    return avatarUrl;
  }

  // Uploads new file and deletes old file safely if exists
  async replaceFile(
    oldFilePath: string | null | undefined,
    newFile: Express.Multer.File,
    folder: string,
  ): Promise<string> {
    const newPath = await this.upload(newFile, folder);

    if (oldFilePath) {
      try {
        await this.delete(oldFilePath);
      } catch (error: unknown) {
        this.logger.error(`Failed to delete replaced file: ${oldFilePath}`, {
          error,
        });
      }
    }

    return newPath;
  }
}
