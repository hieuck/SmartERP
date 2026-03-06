import { Test, TestingModule } from '@nestjs/testing';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { DocumentType } from './entities/document.entity';

describe('DocumentController', () => {
  let controller: DocumentController;
  let service: DocumentService;

  const mockDocumentService = {
    findAll: jest.fn(),
    search: jest.fn(),
    findById: jest.fn(),
    findVersions: jest.fn(),
    createFolder: jest.fn(),
    createFile: jest.fn(),
    createVersion: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockTenantId = 'tenant-123';
  const mockDocumentId = 'doc-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentController],
      providers: [
        {
          provide: DocumentService,
          useValue: mockDocumentService,
        },
      ],
    }).compile();

    controller = module.get<DocumentController>(DocumentController);
    service = module.get<DocumentService>(DocumentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all documents', async () => {
      const mockDocs = [{ id: '1', name: 'Doc 1' }, { id: '2', name: 'Doc 2' }];
      mockDocumentService.findAll.mockResolvedValue(mockDocs);

      const result = await controller.findAll(mockTenantId);

      expect(result).toEqual(mockDocs);
      expect(service.findAll).toHaveBeenCalledWith(mockTenantId, undefined);
    });

    it('should return documents by parent', async () => {
      const parentId = 'parent-123';
      const mockDocs = [{ id: '1', name: 'Doc 1', parentId }];
      mockDocumentService.findAll.mockResolvedValue(mockDocs);

      const result = await controller.findAll(mockTenantId, parentId);

      expect(result).toEqual(mockDocs);
      expect(service.findAll).toHaveBeenCalledWith(mockTenantId, parentId);
    });
  });

  describe('search', () => {
    it('should search documents', async () => {
      const query = 'test';
      const mockResults = [{ id: '1', name: 'Test Doc' }];
      mockDocumentService.search.mockResolvedValue(mockResults);

      const result = await controller.search(mockTenantId, query);

      expect(result).toEqual(mockResults);
      expect(service.search).toHaveBeenCalledWith(mockTenantId, query);
    });
  });

  describe('findById', () => {
    it('should return document by id', async () => {
      const mockDoc = { id: mockDocumentId, name: 'Test Doc' };
      mockDocumentService.findById.mockResolvedValue(mockDoc);

      const result = await controller.findById(mockTenantId, mockDocumentId);

      expect(result).toEqual(mockDoc);
      expect(service.findById).toHaveBeenCalledWith(mockTenantId, mockDocumentId);
    });
  });

  describe('findVersions', () => {
    it('should return document versions', async () => {
      const mockDoc = { id: mockDocumentId, name: 'Test Doc' };
      const mockVersions = [{ id: '1', name: 'Test Doc', version: 1 }];
      mockDocumentService.findById.mockResolvedValue(mockDoc);
      mockDocumentService.findVersions.mockResolvedValue(mockVersions);

      const result = await controller.findVersions(mockTenantId, mockDocumentId);

      expect(result).toEqual(mockVersions);
      expect(service.findById).toHaveBeenCalledWith(mockTenantId, mockDocumentId);
      expect(service.findVersions).toHaveBeenCalledWith(mockTenantId, mockDoc.name);
    });
  });

  describe('createFolder', () => {
    it('should create folder', async () => {
      const name = 'New Folder';
      const parentId = null;
      const uploadedBy = 'user-123';
      const mockFolder = { id: 'folder-123', name, type: DocumentType.FOLDER };
      mockDocumentService.createFolder.mockResolvedValue(mockFolder);

      const result = await controller.createFolder(mockTenantId, name, parentId, uploadedBy);

      expect(result).toEqual(mockFolder);
      expect(service.createFolder).toHaveBeenCalledWith(mockTenantId, name, parentId, uploadedBy);
    });
  });

  describe('createFile', () => {
    it('should create file', async () => {
      const data = { name: 'file.pdf', type: DocumentType.FILE, filePath: '/path/to/file.pdf' };
      const mockFile = { id: 'file-123', ...data };
      mockDocumentService.createFile.mockResolvedValue(mockFile as any);

      const result = await controller.createFile(mockTenantId, data as any);

      expect(result).toEqual(mockFile);
      expect(service.createFile).toHaveBeenCalledWith(mockTenantId, data);
    });
  });

  describe('createVersion', () => {
    it('should create new version', async () => {
      const filePath = '/path/to/new-version.pdf';
      const uploadedBy = 'user-123';
      const mockVersion = { id: 'version-123', version: 2 };
      mockDocumentService.createVersion.mockResolvedValue(mockVersion);

      const result = await controller.createVersion(mockTenantId, mockDocumentId, filePath, uploadedBy);

      expect(result).toEqual(mockVersion);
      expect(service.createVersion).toHaveBeenCalledWith(mockTenantId, mockDocumentId, filePath, uploadedBy);
    });
  });

  describe('update', () => {
    it('should update document', async () => {
      const data = { name: 'Updated Doc' };
      const mockUpdated = { id: mockDocumentId, ...data };
      mockDocumentService.update.mockResolvedValue(mockUpdated);

      const result = await controller.update(mockTenantId, mockDocumentId, data);

      expect(result).toEqual(mockUpdated);
      expect(service.update).toHaveBeenCalledWith(mockTenantId, mockDocumentId, data);
    });
  });

  describe('delete', () => {
    it('should delete document', async () => {
      mockDocumentService.delete.mockResolvedValue(undefined);

      const result = await controller.delete(mockTenantId, mockDocumentId);

      expect(result).toBeUndefined();
      expect(service.delete).toHaveBeenCalledWith(mockTenantId, mockDocumentId);
    });
  });
});
