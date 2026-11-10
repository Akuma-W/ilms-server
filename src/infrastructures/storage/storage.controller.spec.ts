import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';

describe('StorageController', () => {
  let controller: StorageController;

  const storageServiceMock = {
    upload: jest.fn(),
    uploadMany: jest.fn(),
    getUrl: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StorageController],
      providers: [
        {
          provide: StorageService,
          useValue: storageServiceMock,
        },
      ],
    }).compile();

    controller = module.get<StorageController>(StorageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('upload', () => {
    it('should throw BadRequestException if file is missing', async () => {
      await expect(
        controller.upload(
          undefined as unknown as Express.Multer.File,
          'materials',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should upload single file and return path with url', async () => {
      const mockFile = {
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('test'),
        size: 4,
      } as Express.Multer.File;

      storageServiceMock.upload.mockResolvedValue('materials/test-123.pdf');
      storageServiceMock.getUrl.mockResolvedValue(
        'http://localhost:9000/bucket/materials/test-123.pdf',
      );

      const result = await controller.upload(mockFile, 'materials');
      expect(result.path).toBe('materials/test-123.pdf');
      expect(result.url).toBe(
        'http://localhost:9000/bucket/materials/test-123.pdf',
      );
      expect(storageServiceMock.upload).toHaveBeenCalledWith(
        mockFile,
        'materials',
      );
    });
  });

  describe('uploadMany', () => {
    it('should throw BadRequestException if files array is empty', async () => {
      await expect(controller.uploadMany([], 'materials')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should upload multiple files and return paths with urls', async () => {
      const mockFiles = [
        { originalname: 'a.pdf' },
        { originalname: 'b.pdf' },
      ] as Express.Multer.File[];

      storageServiceMock.uploadMany.mockResolvedValue([
        'materials/a.pdf',
        'materials/b.pdf',
      ]);
      storageServiceMock.getUrl.mockImplementation((path: string) =>
        Promise.resolve(`http://localhost:9000/${path}`),
      );

      const results = await controller.uploadMany(mockFiles, 'materials');
      expect(results).toHaveLength(2);
      expect(results[0].url).toBe('http://localhost:9000/materials/a.pdf');
    });
  });

  describe('getFile', () => {
    it('should throw BadRequestException if path is missing', async () => {
      const mockRes = {
        redirect: jest.fn(),
        sendFile: jest.fn(),
      } as unknown as Response;
      await expect(controller.getFile('', mockRes)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should redirect if url starts with http', async () => {
      const redirectMock = jest.fn();
      const mockRes = {
        redirect: redirectMock,
        sendFile: jest.fn(),
      } as unknown as Response;
      storageServiceMock.getUrl.mockResolvedValue(
        'http://localhost:9000/file.pdf',
      );

      await controller.getFile('assignments/file.pdf', mockRes);
      expect(redirectMock).toHaveBeenCalledWith(
        'http://localhost:9000/file.pdf',
      );
    });

    it('should sendFile if url is local path', async () => {
      const sendFileMock = jest.fn();
      const mockRes = {
        redirect: jest.fn(),
        sendFile: sendFileMock,
      } as unknown as Response;
      storageServiceMock.getUrl.mockResolvedValue('/uploads/file.pdf');

      await controller.getFile('assignments/file.pdf', mockRes);
      expect(sendFileMock).toHaveBeenCalled();
    });
  });

  describe('getUrl', () => {
    it('should throw BadRequestException if path is missing', async () => {
      await expect(controller.getUrl('')).rejects.toThrow(BadRequestException);
    });

    it('should return url object', async () => {
      storageServiceMock.getUrl.mockResolvedValue(
        'http://localhost:9000/file.pdf',
      );
      const result = await controller.getUrl('assignments/file.pdf');
      expect(result).toEqual({ url: 'http://localhost:9000/file.pdf' });
    });
  });
});
