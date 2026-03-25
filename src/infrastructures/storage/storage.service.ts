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

  async upload(file: Express.Multer.File, folder: string) {
    this.logger.log(`Uploading file to ${folder}`);
    return this.provider.upload(file, folder);
  }

  async uploadMany(files: Express.Multer.File[], folder: string) {
    return this.provider.uploadMany(files, folder);
  }

  async delete(filePath: string) {
    return this.provider.delete(filePath);
  }

  async getUrl(filePath: string) {
    return this.provider.getFileUrl(filePath);
  }
}
