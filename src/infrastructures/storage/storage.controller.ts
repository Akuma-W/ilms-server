import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import type { Express, Response } from 'express';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const { mimetype, buffer, originalname } = file;

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
      'video/mp4',
    ];

    if (!allowedTypes.includes(mimetype)) {
      throw new BadRequestException('File type not allowed');
    }

    const filename = `${Date.now()}-${originalname}`;

    await this.storageService.upload('app-storage', filename, buffer, mimetype);

    return {
      message: 'Upload success',
      url: `/files/${filename}`,
    };
  }

  @Get(':filename')
  async getFile(@Param('filename') filename: string, @Res() res: Response) {
    const stream = await this.storageService.get('app-storage', filename);

    stream.pipe(res);
  }

  @Post('delete/:filename')
  async delete(@Param('filename') filename: string) {
    await this.storageService.remove('app-storage', filename);

    return {
      message: 'File deleted',
    };
  }
}
