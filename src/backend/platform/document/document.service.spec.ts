import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DocumentService } from './document.service';
import { Document, DocumentType } from './entities/document.entity';
import { NotFoundException } from '@nestjs/common';
import { CacheService } from '@/common/cache/cache.service';
import { createMockUser } from '@/common/test/test-helpers';

describe('DocumentService', () => {
  let service: DocumentService;

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockDocumentRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getOrSet: jest.fn(),
    invalidateEntity: jest.fn(),
  };

  const mockUser = createMockUser();

  beforeEach(async () => {
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
      ],
    }).compile();

    service = module.get<DocumentService>(DocumentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should find root documents', async () => {
      const mockDocs = [{ id: '1', name: 'Doc 1', parentId: null }];
      mockQueryBuilder.getMany.mockResolvedValue(mockDocs);

      const result = await service.findAll(mockUser);

      expect(result).toEqual(mockDocs);
      expect(mockDocumentRepository.createQueryBuilder).toHaveBeenCalledWith('document');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith([
        'document.id',
        'document.name',
        'document.type',
        'document.filePath',
        'document.mimeType',
        'document.size',
        'document.version',
        'document.parentId',
        'document.uploadedBy',
        'document.createdAt',
      ]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('document.tenantId = :tenantId', {
        tenantId: 'tenant-1',
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('document.parentId IS NULL');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('document.createdAt', 'DESC');
    });

    it('should find documents by parent', async () => {
      const mockDocs = [{ id: '2', name: 'Doc 2', parentId: 'parent-1' }];
      mockQueryBuilder.getMany.mockResolvedValue(mockDocs);

      const result = await service.findAll(mockUser, 'parent-1');

      expect(result).toEqual(mockDocs);
      expect(mockDocumentRepository.createQueryBuilder).toHaveBeenCalledWith('document');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('document.tenantId = :tenantId', {
        tenantId: 'tenant-1',
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('document.parentId = :parentId', {
        parentId: 'parent-1',
      });
    });
  });

  describe('findById', () => {
    it('should find document by id', async () => {
      const mockDoc = { id: '1', name: 'Doc 1' };
      mockCacheService.getOrSet.mockResolvedValue(mockDoc);

      const result = await service.findById(mockUser, '1');

      expect(result).toEqual(mockDoc);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException if not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockDocumentRepository.findOne.mockResolvedValue(null);

      await expect(service.findById(mockUser, '999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createFolder', () => {
    it('should create a folder', async () => {
      const mockFolder = {
        name: 'New Folder',
        type: DocumentType.FOLDER,
        parentId: null,
      };
      mockDocumentRepository.create.mockReturnValue(mockFolder);
      mockDocumentRepository.save.mockResolvedValue(mockFolder);

      const result = await service.createFolder(mockUser, 'New Folder', null, 'user-1');

      expect(result.type).toBe(DocumentType.FOLDER);
    });
  });

  describe('createFile', () => {
    it('should create a file', async () => {
      const fileData = {
        name: 'document.pdf',
        filePath: '/uploads/document.pdf',
        mimeType: 'application/pdf',
        size: 1024,
      };
      mockDocumentRepository.create.mockReturnValue({
        ...fileData,
        type: DocumentType.FILE,
      });
      mockDocumentRepository.save.mockResolvedValue({
        ...fileData,
        type: DocumentType.FILE,
      });

      const result = await service.createFile(mockUser, fileData);

      expect(result.type).toBe(DocumentType.FILE);
    });
  });

  describe('update', () => {
    it('should update document and invalidate cache', async () => {
      const mockDoc = { id: '1', name: 'Old Name', tenantId: 'tenant-1' };
      const updatedDoc = { id: '1', name: 'New Name', tenantId: 'tenant-1' };

      mockCacheService.getOrSet.mockResolvedValueOnce(mockDoc).mockResolvedValueOnce(updatedDoc);
      mockDocumentRepository.update.mockResolvedValue({ affected: 1 });
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.update(mockUser, '1', { name: 'New Name' });

      expect(mockDocumentRepository.update).toHaveBeenCalledWith(
        { tenantId: 'tenant-1', id: '1' },
        { name: 'New Name' },
      );
      expect(mockCacheService.del).toHaveBeenCalled();
      expect(result).toEqual(updatedDoc);
    });

    it('should throw NotFoundException if document not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockDocumentRepository.findOne.mockResolvedValue(null);

      await expect(service.update(mockUser, '999', { name: 'New Name' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should soft delete document and invalidate cache', async () => {
      const mockDoc = { id: '1', name: 'Doc to Delete', tenantId: 'tenant-1' };

      mockCacheService.getOrSet.mockResolvedValue(mockDoc);
      mockDocumentRepository.softDelete.mockResolvedValue({ affected: 1 });
      mockCacheService.del.mockResolvedValue(undefined);

      await service.delete(mockUser, '1');

      expect(mockDocumentRepository.softDelete).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        id: '1',
      });
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw NotFoundException if document not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockDocumentRepository.findOne.mockResolvedValue(null);

      await expect(service.delete(mockUser, '999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createVersion', () => {
    it('should create new version of document', async () => {
      const mockDoc = {
        id: '1',
        name: 'document.pdf',
        version: 1,
        filePath: '/old/path.pdf',
      };
      mockCacheService.getOrSet.mockResolvedValue(mockDoc);
      mockDocumentRepository.create.mockReturnValue({
        ...mockDoc,
        id: '2',
        version: 2,
        filePath: '/new/path.pdf',
      });
      mockDocumentRepository.save.mockResolvedValue({
        ...mockDoc,
        id: '2',
        version: 2,
        filePath: '/new/path.pdf',
      });
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.createVersion(mockUser, '1', '/new/path.pdf', 'user-1');

      expect(result.version).toBe(2);
      expect(mockCacheService.del).toHaveBeenCalled();
    });
  });

  describe('findVersions', () => {
    it('should find all versions of a document by name', async () => {
      const mockVersions = [
        { id: '1', name: 'document.pdf', version: 3 },
        { id: '2', name: 'document.pdf', version: 2 },
        { id: '3', name: 'document.pdf', version: 1 },
      ];
      mockDocumentRepository.find.mockResolvedValue(mockVersions);

      const result = await service.findVersions(mockUser, 'document.pdf');

      expect(result).toEqual(mockVersions);
      expect(mockDocumentRepository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', name: 'document.pdf' },
        order: { version: 'DESC' },
      });
    });

    it('should return empty array if no versions found', async () => {
      mockDocumentRepository.find.mockResolvedValue([]);

      const result = await service.findVersions(mockUser, 'nonexistent.pdf');

      expect(result).toEqual([]);
    });
  });

  describe('search', () => {
    it('should search documents', async () => {
      const mockDocs = [{ id: '1', name: 'Test Document' }];
      mockQueryBuilder.getMany.mockResolvedValue(mockDocs);

      const result = await service.search(mockUser, 'test');

      expect(result).toEqual(mockDocs);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });
  });
});
