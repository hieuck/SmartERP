import { Test, TestingModule } from '@nestjs/testing';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { DocumentType } from './enums/document-type.enum';
import { createMockUser } from '@/common/test/test-helpers';

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

  const mockUser = createMockUser();

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

      const result = await controller.findAll(mockUser);

      expect(result).toEqual(mockDocs);
      expect(service.findAll).toHaveBeenCalledWith(mockUser, undefined);
    });

    it('should return documents by parent', async () => {
      const parentId = 'parent-123';
      const mockDocs = [{ id: '1', name: 'Doc 1', parentId }];
      mockDocumentService.findAll.mockResolvedValue(mockDocs);

      const result = await controller.findAll(mockUser, parentId);

      expect(result).toEqual(mockDocs);
      expect(service.findAll).toHaveBeenCalledWith(mockUser, parentId);
    });
  });

  describe('search', () => {
    it('should search documents', async () => {
      const query = 'test';
      const mockResults = [{ id: '1', name: 'Test Doc' }];
      mockDocumentService.search.mockResolvedValue(mockResults);

      const result = await controller.search(mockUser, query);

      expect(result).toEqual(mockResults);
      expect(service.search).toHaveBeenCalledWith(mockUser, query);
    });
  });

  describe('findById', () => {
    it('should return document by id', async () => {
      const mockDoc = { id: mockDocumentId, name: 'Test Doc' };
      mockDocumentService.findById.mockResolvedValue(mockDoc);

      const result = await controller.findById(mockUser, mockDocumentId);

      expect(result).toEqual(mockDoc);
      expect(service.findById).toHaveBeenCalledWith(mockUser, mockDocumentId);
    });
  });

  describe('findVersions', () => {
    it('should return document versions', async () => {
      const mockDoc = { id: mockDocumentId, name: 'Test Doc' };
      const mockVersions = [{ id: '1', name: 'Test Doc', version: 1 }];
      mockDocumentService.findById.mockResolvedValue(mockDoc);
      mockDocumentService.findVersions.mockResolvedValue(mockVersions);

      const result = await controller.findVersions(mockUser, mockDocumentId);

      expect(result).toEqual(mockVersions);
      expect(service.findById).toHaveBeenCalledWith(mockUser, mockDocumentId);
      expect(service.findVersions).toHaveBeenCalledWith(mockUser, mockDoc.name);
    });
  });

  describe('createFolder', () => {
    it('should create folder', async () => {
      const name = 'New Folder';
      const parentId = null;
      const uploadedBy = 'user-123';
      const mockFolder = { id: 'folder-123', name, type: DocumentType.FOLDER };
      mockDocumentService.createFolder.mockResolvedValue(mockFolder);

      const result = await controller.createFolder(mockUser, name, parentId, uploadedBy);

      expect(result).toEqual(mockFolder);
      expect(service.createFolder).toHaveBeenCalledWith(mockUser, name, parentId);
    });
  });

  describe('createFile', () => {
    it('should create file', async () => {
      const data = { name: 'file.pdf', type: DocumentType.FILE, filePath: '/path/to/file.pdf' };
      const mockFile = { id: 'file-123', ...data };
      mockDocumentService.createFile.mockResolvedValue(mockFile as any);

      const result = await controller.createFile(mockUser, data as any);

      expect(result).toEqual(mockFile);
      expect(service.createFile).toHaveBeenCalledWith(mockUser, data);
    });
  });

  describe('createVersion', () => {
    it('should create new version', async () => {
      const filePath = '/path/to/new-version.pdf';
      const uploadedBy = 'user-123';
      const mockVersion = { id: 'version-123', version: 2 };
      mockDocumentService.createVersion.mockResolvedValue(mockVersion);

      const result = await controller.createVersion(mockUser, mockDocumentId, filePath, uploadedBy);

      expect(result).toEqual(mockVersion);
      expect(service.createVersion).toHaveBeenCalledWith(mockUser, mockDocumentId, filePath);
    });
  });

  describe('update', () => {
    it('should update document', async () => {
      const data = { name: 'Updated Doc' };
      const mockUpdated = { id: mockDocumentId, ...data };
      mockDocumentService.update.mockResolvedValue(mockUpdated);

      const result = await controller.update(mockUser, mockDocumentId, data);

      expect(result).toEqual(mockUpdated);
      expect(service.update).toHaveBeenCalledWith(mockUser, mockDocumentId, data);
    });
  });

  describe('delete', () => {
    it('should delete document', async () => {
      mockDocumentService.delete.mockResolvedValue(undefined);

      const result = await controller.delete(mockUser, mockDocumentId);

      expect(result).toBeUndefined();
      expect(service.delete).toHaveBeenCalledWith(mockUser, mockDocumentId);
    });
  });
});
