import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { DocumentService } from './document.service';
import { Document } from './entities/document.entity';
import { DocumentType } from './enums/document-type.enum';
import { CacheService } from '@common/cache/cache.service';
import { PermissionService, User } from '@common/security/permission.service';

describe('DocumentService', () => {
  let service: DocumentService;
  let documentRepository: jest.Mocked<Repository<Document>>;
  let cacheService: jest.Mocked<CacheService>;
  let permissionService: jest.Mocked<PermissionService>;

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    roles: ['admin'],
  };

  const mockDocument: Document = {
    id: 'doc-1',
    name: 'Test Document',
    type: DocumentType.FILE,
    filePath: '/uploads/test.pdf',
    mimeType: 'application/pdf',
    size: 1024,
    version: 1,
    parentId: null,
    uploadedBy: 'user-1',
    createdAt: new Date(),
  } as Document;

  beforeEach(async () => {
    const mockDocumentRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockCacheService = {
      getOrSet: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const mockPermissionService = {
      buildSecureQuery: jest.fn(),
      canRead: jest.fn().mockReturnValue(true),
      canWrite: jest.fn().mockReturnValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentService,
        {
          provide: getRepositoryToken(Document),
          useValue: mockDocumentRepository,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
      ],
    }).compile();

    service = module.get<DocumentService>(DocumentService);
    documentRepository = module.get(getRepositoryToken(Document));
    cacheService = module.get(CacheService);
    permissionService = module.get(PermissionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all root documents', async () => {
      const mockSecureRepo = {
        find: jest.fn().mockResolvedValue([mockDocument]),
      };
      (service as any).secureDocumentRepo = mockSecureRepo;

      const result = await service.findAll(mockUser);

      expect(result).toEqual([mockDocument]);
      expect(mockSecureRepo.find).toHaveBeenCalledWith(mockUser, expect.objectContaining({
        where: { parentId: IsNull() },
      }));
    });

    it('should return documents by parentId', async () => {
      const mockSecureRepo = {
        find: jest.fn().mockResolvedValue([mockDocument]),
      };
      (service as any).secureDocumentRepo = mockSecureRepo;

      await service.findAll(mockUser, 'parent-1');

      expect(mockSecureRepo.find).toHaveBeenCalledWith(mockUser, expect.objectContaining({
        where: { parentId: 'parent-1' },
      }));
    });
  });

  describe('findById', () => {
    it('should return document from cache', async () => {
      const mockSecureRepo = {
        findOne: jest.fn().mockResolvedValue(mockDocument),
      };
      (service as any).secureDocumentRepo = mockSecureRepo;
      cacheService.getOrSet.mockImplementation(async (_key, fn) => fn());

      const result = await service.findById(mockUser, 'doc-1');

      expect(result).toEqual(mockDocument);
    });

    it('should throw NotFoundException when not found', async () => {
      const mockSecureRepo = {
        findOne: jest.fn().mockResolvedValue(null),
      };
      (service as any).secureDocumentRepo = mockSecureRepo;
      cacheService.getOrSet.mockImplementation(async (_key, fn) => fn());

      await expect(service.findById(mockUser, 'non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createFolder', () => {
    it('should create folder successfully', async () => {
      documentRepository.create.mockReturnValue(mockDocument as any);
      documentRepository.save.mockResolvedValue(mockDocument);

      const result = await service.createFolder(mockUser, 'New Folder', null);

      expect(result).toEqual(mockDocument);
      expect(documentRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New Folder',
        type: DocumentType.FOLDER,
      }));
    });
  });

  describe('createFile', () => {
    it('should create file successfully', async () => {
      documentRepository.create.mockReturnValue(mockDocument as any);
      documentRepository.save.mockResolvedValue(mockDocument);

      const result = await service.createFile(mockUser, { name: 'test.pdf', filePath: '/uploads/test.pdf' });

      expect(result).toEqual(mockDocument);
    });
  });

  describe('update', () => {
    it('should update document successfully', async () => {
      const mockSecureRepo = {
        findOne: jest.fn().mockResolvedValue(mockDocument),
      };
      (service as any).secureDocumentRepo = mockSecureRepo;
      cacheService.getOrSet.mockImplementation(async (_key, fn) => fn());
      documentRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.update(mockUser, 'doc-1', { name: 'Updated' });

      expect(documentRepository.update).toHaveBeenCalled();
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete document successfully', async () => {
      const mockSecureRepo = {
        findOne: jest.fn().mockResolvedValue(mockDocument),
      };
      (service as any).secureDocumentRepo = mockSecureRepo;
      cacheService.getOrSet.mockImplementation(async (_key, fn) => fn());
      documentRepository.softDelete.mockResolvedValue({ affected: 1 } as any);

      await service.delete(mockUser, 'doc-1');

      expect(documentRepository.softDelete).toHaveBeenCalled();
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('createVersion', () => {
    it('should create new version successfully', async () => {
      const mockSecureRepo = {
        findOne: jest.fn().mockResolvedValue(mockDocument),
        save: jest.fn().mockResolvedValue({ ...mockDocument, version: 2 }),
      };
      (service as any).secureDocumentRepo = mockSecureRepo;
      cacheService.getOrSet.mockImplementation(async (_key, fn) => fn());

      const result = await service.createVersion(mockUser, 'doc-1', '/uploads/test-v2.pdf');

      expect(result.version).toBe(2);
    });
  });

  describe('search', () => {
    it('should search documents by query', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockDocument]),
      };
      documentRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.search(mockUser, 'test');

      expect(result).toEqual([mockDocument]);
    });
  });
});
