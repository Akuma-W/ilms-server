import { Injectable } from '@nestjs/common';
import { StorageProvider } from '../interfaces/storage-provider.interface';
import { Client } from 'minio';
import { ConfigService } from '@nestjs/config';
import { generateFileName } from '../utils/file.util';

@Injectable()
export class MinioStorageProvider implements StorageProvider {
  private client: Client;
  private bucket: string;

  constructor(private config: ConfigService) {
    this.client = new Client({
      endPoint: this.config.get<string>('minio.endPoint') || 'localhost',
      port: this.config.get<number>('minio.port'),
      useSSL: this.config.get<boolean>('minio.useSSL'),
      accessKey: this.config.get<string>('minio.accessKey'),
      secretKey: this.config.get<string>('minio.secretKey'),
    });

    this.bucket = this.config.get<string>('minio.bucket') || '';
  }

  async upload(file: Express.Multer.File, folder: string): Promise<string> {
    const bucketExists = await this.client
      .bucketExists(this.bucket)
      .catch(() => false);
    if (!bucketExists) {
      await this.client.makeBucket(this.bucket).catch(() => null);
    }

    const fileName = generateFileName(file);
    const objectName = `${folder}/${fileName}`;

    await this.client.putObject(
      this.bucket,
      objectName,
      file.buffer,
      file.size,
      { 'Content-Type': file.mimetype },
    );

    return objectName;
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
    await this.client.removeObject(this.bucket, filePath);
  }

  async getFileUrl(filePath: string, expries?: number): Promise<string> {
    let cleanPath = filePath;
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      try {
        const parsed = new URL(filePath);
        const pathname = parsed.pathname.replace(/^\/+/, '');
        const parts = pathname.split('/');
        if (parts[0] === this.bucket) {
          cleanPath = parts.slice(1).join('/');
        } else {
          cleanPath = pathname;
        }
      } catch {
        cleanPath = filePath;
      }
    }

    const presignedUrl = await this.client.presignedUrl(
      'GET',
      this.bucket,
      cleanPath,
      expries ?? 60 * 60, // default: 1h
    );

    const useSSL = this.config.get<boolean>('minio.useSSL');
    const protocol = useSSL ? 'https' : 'http';

    const url = new URL(presignedUrl);
    url.protocol = protocol + ':';

    return url.toString();
  }
}
