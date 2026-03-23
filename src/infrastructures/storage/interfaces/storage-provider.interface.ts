export interface StorageProvider {
  upload(file: Express.Multer.File, folder: string): Promise<string>;

  uploadMany(files: Express.Multer.File[], folder: string): Promise<string[]>;

  delete(filePath: string): Promise<void>;

  getFileUrl(filePath: string): Promise<string>;
}
