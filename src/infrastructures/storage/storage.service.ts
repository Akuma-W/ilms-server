import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';

@Injectable()
export class StorageService {
  private client: Client;

  constructor(private config: ConfigService) {
    this.client = new Client({
      endPoint: this.config.get<string>('minio.endPoint') || 'localhost',
      port: this.config.get<number>('minio.port'),
      useSSL: false,
      accessKey: this.config.get<string>('minio.accessKey'),
      secretKey: this.config.get<string>('minio.secretKey'),
    });
  }

  async upload(
    bucket: string,
    objectName: string,
    buffer: Buffer,
    mime: string,
  ) {
    return this.client.putObject(bucket, objectName, buffer, buffer.length, {
      'Content-Type': mime,
    });
  }

  async get(objectName: string, bucket: string) {
    return this.client.getObject(bucket, objectName);
  }

  async remove(bucket: string, objectName: string) {
    return this.client.removeObject(bucket, objectName);
  }
}
