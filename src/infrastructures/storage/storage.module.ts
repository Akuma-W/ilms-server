import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { LocalStorageProvider } from './providers/local.provider';
import { MinioStorageProvider } from './providers/minio.provider';
import { LoggerModule } from 'src/logger/logger.module';

@Module({
  imports: [LoggerModule],
  providers: [StorageService, LocalStorageProvider, MinioStorageProvider],
  exports: [StorageService],
  controllers: [StorageController],
})
export class StorageModule {}
