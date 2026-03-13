import {
  Controller,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder: string,
  ) {
    const path = await this.storageService.upload(file, folder);

    return {
      path,
      url: this.storageService.getUrl(path),
    };
  }

  @Post('upload-many')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadMany(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('folder') folder: string,
  ) {
    const paths = await this.storageService.uploadMany(files, folder);

    return paths.map((path) => ({
      path,
      url: this.storageService.getUrl(path),
    }));
  }
}
