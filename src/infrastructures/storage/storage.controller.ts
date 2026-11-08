import {
  BadRequestException,
  Controller,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { StorageService } from './storage.service';

/**
 * Controller handling file storage and MinIO uploads.
 */
@ApiTags('Storage')
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const path = await this.storageService.upload(file, folder || 'general');

    return {
      path,
      url: await this.storageService.getUrl(path),
    };
  }

  @Post('upload-many')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadMany(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('folder') folder: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Files are required');
    }
    const paths = await this.storageService.uploadMany(
      files,
      folder || 'general',
    );

    const results = await Promise.all(
      paths.map(async (path) => ({
        path,
        url: await this.storageService.getUrl(path),
      })),
    );

    return results;
  }
}
