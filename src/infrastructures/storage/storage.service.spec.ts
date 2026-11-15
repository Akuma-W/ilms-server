import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import { ConfigService } from '@nestjs/config';
import { LocalStorageProvider } from './providers/local.provider';
import { MinioStorageProvider } from './providers/minio.provider';
import { LoggerService } from 'src/logger/logger.service';

describe('StorageService', () => {
  let service: StorageService;

  const mockProvider = {
    upload: jest.fn(),
    uploadMany: jest.fn(),
    delete: jest.fn(),
    getFileUrl: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('local'),
          },
        },
        {
          provide: LocalStorageProvider,
          useValue: mockProvider,
        },
        {
          provide: MinioStorageProvider,
          useValue: mockProvider,
        },
        {
          provide: LoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAvatarUrl', () => {
    it('should return null when avatarUrl is null', async () => {
      const result = await service.getAvatarUrl(null);
      expect(result).toBeNull();
    });

    it('should resolve avatars folder path via provider getFileUrl', async () => {
      mockProvider.getFileUrl.mockResolvedValue(
        'http://minio/files/avatars/user.png',
      );

      const result = await service.getAvatarUrl('/avatars/user.png');

      expect(mockProvider.getFileUrl).toHaveBeenCalledWith('avatars/user.png');
      expect(result).toBe('http://minio/files/avatars/user.png');
    });

    it('should return original url when not an avatar storage path', async () => {
      const result = await service.getAvatarUrl(
        'https://google.com/avatar.png',
      );
      expect(result).toBe('https://google.com/avatar.png');
      expect(mockProvider.getFileUrl).not.toHaveBeenCalled();
    });
  });

  describe('replaceFile', () => {
    const mockFile = {
      originalname: 'new.png',
    } as Express.Multer.File;

    it('should upload new file and delete old file if path exists', async () => {
      mockProvider.upload.mockResolvedValue('avatars/new.png');
      mockProvider.delete.mockResolvedValue(undefined);

      const result = await service.replaceFile(
        'avatars/old.png',
        mockFile,
        'avatars',
      );

      expect(mockProvider.upload).toHaveBeenCalledWith(mockFile, 'avatars');
      expect(mockProvider.delete).toHaveBeenCalledWith('avatars/old.png');
      expect(result).toBe('avatars/new.png');
    });

    it('should upload new file without deletion when old path is empty', async () => {
      mockProvider.upload.mockResolvedValue('avatars/new.png');

      const result = await service.replaceFile(null, mockFile, 'avatars');

      expect(mockProvider.upload).toHaveBeenCalledWith(mockFile, 'avatars');
      expect(mockProvider.delete).not.toHaveBeenCalled();
      expect(result).toBe('avatars/new.png');
    });
  });
});
