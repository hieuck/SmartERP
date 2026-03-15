/**
 * DocumentController Integration Tests
 * Coverage target: 95%+
 * 
 * Test cases:
 * 1. GET /documents - Get all documents
 * 2. GET /documents?parentId=xxx - Get documents by parent
 * 3. GET /documents/search?q=xxx - Search documents
 * 4. GET /documents/:id - Get document by ID
 * 5. GET /documents/:id/versions - Get document versions
 * 6. POST /documents/folders - Create folder
 * 7. POST /documents/files - Create file
 * 8. POST /documents/:id/versions - Create new version
 * 9. PUT /documents/:id - Update document
 * 10. DELETE /documents/:id - Delete document
 * 11. Authentication/Authorization tests
 * 12. Validation tests
 * 13. Edge cases and error scenarios
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { DocumentType } from './enums/document-type.enum';

describe('DocumentController (Integration)', () => {
  let app: INestApplication;
  let documentService: jest.Mocked<DocumentService>;

  const mockUser = {
    id: 'user-123',
    tenantId: 'tenant-123',
    roles: ['user'],
  };

  const mockFolder = {
    id: 'folder-123',
    name: 'Documents',
    type: DocumentType.FOLDER,
    filePath: null,
    mimeType: null,
    size: null,
    version: 1,
    parentId: null,
    uploadedBy: 'user-123',
    tenantId: 'tenant-123',
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  };

  const mockFile = {
    id: 'file-123',
    name: 'contract.pdf',
    type: DocumentType.FILE,
    filePath: '/uploads/contract.pdf',
    mimeType: 'application/pdf',
    size: 1024000,
    version: 1,
    parentId: 'folder-123',
    uploadedBy: 'user-123',
    tenantId: 'tenant-123',
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  };

  beforeAll(async () => {
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

    const mockJwtAuthGuard = {
      canActivate: jest.fn().mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
          request.user = mockUser;
          return true;
        }
        
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [DocumentController],
      providers: [
        {
          provide: DocumentService,
          useValue: mockDocumentService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    documentService = moduleFixture.get(DocumentService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /documents', () => {
    it('should return all root documents when no parentId', async () => {
      const documents = [mockFolder, mockFile];
      documentService.findAll.mockResolvedValue(documents as any);

      const response = await request(app.getHttpServer())
        .get('/documents')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(documents);
      expect(documentService.findAll).toHaveBeenCalledWith(mockUser, undefined);
    });

    it('should return documents by parentId', async () => {
      const documents = [mockFile];
      documentService.findAll.mockResolvedValue(documents as any);

      const response = await request(app.getHttpServer())
        .get('/documents?parentId=folder-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(documents);
      expect(documentService.findAll).toHaveBeenCalledWith(mockUser, 'folder-123');
    });

    it('should return empty array when no documents', async () => {
      documentService.findAll.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/documents')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/documents')
        .expect(401);
    });

    it('should handle service errors', async () => {
      documentService.findAll.mockRejectedValue(
        new HttpException('Database error', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      await request(app.getHttpServer())
        .get('/documents')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);
    });
  });

  describe('GET /documents/search', () => {
    it('should search documents by query', async () => {
      const documents = [mockFile];
      documentService.search.mockResolvedValue(documents as any);

      const response = await request(app.getHttpServer())
        .get('/documents/search?q=contract')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(documents);
      expect(documentService.search).toHaveBeenCalledWith(mockUser, 'contract');
    });

    it('should return empty array when no matches', async () => {
      documentService.search.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/documents/search?q=nonexistent')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should handle empty query string', async () => {
      documentService.search.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/documents/search?q=')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(documentService.search).toHaveBeenCalledWith(mockUser, '');
    });

    it('should handle special characters in query', async () => {
      documentService.search.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/documents/search?q=contract%20%26%20agreement')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(documentService.search).toHaveBeenCalledWith(mockUser, 'contract & agreement');
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/documents/search?q=test')
        .expect(401);
    });
  });

  describe('GET /documents/:id', () => {
    it('should return document by ID', async () => {
      documentService.findById.mockResolvedValue(mockFile as any);

      const response = await request(app.getHttpServer())
        .get('/documents/file-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockFile);
      expect(documentService.findById).toHaveBeenCalledWith(mockUser, 'file-123');
    });

    it('should return 404 when document not found', async () => {
      documentService.findById.mockRejectedValue(
        new HttpException('Document with ID file-999 not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/documents/file-999')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/documents/file-123')
        .expect(401);
    });
  });

  describe('GET /documents/:id/versions', () => {
    it('should return document versions', async () => {
      const versions = [
        { ...mockFile, version: 2 },
        { ...mockFile, version: 1 },
      ];

      documentService.findById.mockResolvedValue(mockFile as any);
      documentService.findVersions.mockResolvedValue(versions as any);

      const response = await request(app.getHttpServer())
        .get('/documents/file-123/versions')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(versions);
      expect(documentService.findById).toHaveBeenCalledWith(mockUser, 'file-123');
      expect(documentService.findVersions).toHaveBeenCalledWith(mockUser, mockFile.name);
    });

    it('should return empty array when no versions', async () => {
      documentService.findById.mockResolvedValue(mockFile as any);
      documentService.findVersions.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/documents/file-123/versions')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return 404 when document not found', async () => {
      documentService.findById.mockRejectedValue(
        new HttpException('Document not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/documents/file-999/versions')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/documents/file-123/versions')
        .expect(401);
    });
  });

  describe('POST /documents/folders', () => {
    it('should create folder successfully', async () => {
      const createDto = {
        name: 'New Folder',
        parentId: null,
        uploadedBy: 'user-123',
      };

      documentService.createFolder.mockResolvedValue(mockFolder as any);

      const response = await request(app.getHttpServer())
        .post('/documents/folders')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);

      expect(response.body.name).toBe('Documents');
      expect(response.body.type).toBe(DocumentType.FOLDER);
      expect(documentService.createFolder).toHaveBeenCalledWith(mockUser, 'New Folder', null);
    });

    it('should create subfolder with parentId', async () => {
      const createDto = {
        name: 'Subfolder',
        parentId: 'folder-123',
        uploadedBy: 'user-123',
      };

      const subfolder = { ...mockFolder, id: 'subfolder-123', name: 'Subfolder', parentId: 'folder-123' };
      documentService.createFolder.mockResolvedValue(subfolder as any);

      const response = await request(app.getHttpServer())
        .post('/documents/folders')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);

      expect(response.body.parentId).toBe('folder-123');
      expect(documentService.createFolder).toHaveBeenCalledWith(mockUser, 'Subfolder', 'folder-123');
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/documents/folders')
        .send({ name: 'Test', parentId: null, uploadedBy: 'user-123' })
        .expect(401);
    });
  });

  describe('POST /documents/files', () => {
    it('should create file successfully', async () => {
      const createDto = {
        name: 'document.pdf',
        filePath: '/uploads/document.pdf',
        mimeType: 'application/pdf',
        size: 2048000,
        parentId: 'folder-123',
      };

      documentService.createFile.mockResolvedValue(mockFile as any);

      const response = await request(app.getHttpServer())
        .post('/documents/files')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);

      expect(response.body.type).toBe(DocumentType.FILE);
      expect(documentService.createFile).toHaveBeenCalledWith(mockUser, createDto);
    });

    it('should create file in root when no parentId', async () => {
      const createDto = {
        name: 'root-file.pdf',
        filePath: '/uploads/root-file.pdf',
        mimeType: 'application/pdf',
        size: 1024000,
      };

      const rootFile = { ...mockFile, parentId: null };
      documentService.createFile.mockResolvedValue(rootFile as any);

      const response = await request(app.getHttpServer())
        .post('/documents/files')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);

      expect(response.body.parentId).toBeNull();
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/documents/files')
        .send({ name: 'test.pdf', filePath: '/test.pdf' })
        .expect(401);
    });
  });

  describe('POST /documents/:id/versions', () => {
    it('should create new version successfully', async () => {
      const versionDto = {
        filePath: '/uploads/contract-v2.pdf',
        uploadedBy: 'user-123',
      };

      const newVersion = { ...mockFile, version: 2, filePath: '/uploads/contract-v2.pdf' };
      documentService.createVersion.mockResolvedValue(newVersion as any);

      const response = await request(app.getHttpServer())
        .post('/documents/file-123/versions')
        .set('Authorization', 'Bearer valid-token')
        .send(versionDto)
        .expect(201);

      expect(response.body.version).toBe(2);
      expect(documentService.createVersion).toHaveBeenCalledWith(
        mockUser,
        'file-123',
        '/uploads/contract-v2.pdf',
      );
    });

    it('should return 404 when document not found', async () => {
      documentService.createVersion.mockRejectedValue(
        new HttpException('Document not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .post('/documents/file-999/versions')
        .set('Authorization', 'Bearer valid-token')
        .send({ filePath: '/test.pdf', uploadedBy: 'user-123' })
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/documents/file-123/versions')
        .send({ filePath: '/test.pdf', uploadedBy: 'user-123' })
        .expect(401);
    });
  });

  describe('PUT /documents/:id', () => {
    it('should update document successfully', async () => {
      const updateDto = {
        name: 'Updated Contract.pdf',
        description: 'Updated description',
      };

      const updatedDoc = { ...mockFile, ...updateDto };
      documentService.update.mockResolvedValue(updatedDoc as any);

      const response = await request(app.getHttpServer())
        .put('/documents/file-123')
        .set('Authorization', 'Bearer valid-token')
        .send(updateDto)
        .expect(200);

      expect(response.body.name).toBe('Updated Contract.pdf');
      expect(documentService.update).toHaveBeenCalledWith(mockUser, 'file-123', updateDto);
    });

    it('should return 404 when document not found', async () => {
      documentService.update.mockRejectedValue(
        new HttpException('Document not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .put('/documents/file-999')
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'Test' })
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .put('/documents/file-123')
        .send({ name: 'Test' })
        .expect(401);
    });
  });

  describe('DELETE /documents/:id', () => {
    it('should delete document successfully', async () => {
      documentService.delete.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete('/documents/file-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(documentService.delete).toHaveBeenCalledWith(mockUser, 'file-123');
    });

    it('should return 404 when document not found', async () => {
      documentService.delete.mockRejectedValue(
        new HttpException('Document not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .delete('/documents/file-999')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .delete('/documents/file-123')
        .expect(401);
    });

    it('should handle cascade delete for folders', async () => {
      documentService.delete.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete('/documents/folder-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(documentService.delete).toHaveBeenCalledWith(mockUser, 'folder-123');
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent requests', async () => {
      documentService.findAll.mockResolvedValue([mockFile] as any);

      const requests = Array(5)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .get('/documents')
            .set('Authorization', 'Bearer valid-token'),
        );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });

    it('should handle very long document names', async () => {
      const longName = 'a'.repeat(500);
      documentService.createFolder.mockResolvedValue({ ...mockFolder, name: longName } as any);

      await request(app.getHttpServer())
        .post('/documents/folders')
        .set('Authorization', 'Bearer valid-token')
        .send({ name: longName, parentId: null, uploadedBy: 'user-123' })
        .expect(201);
    });

    it('should handle special characters in document names', async () => {
      const specialName = 'Document (2024) [Final] #1.pdf';
      documentService.createFile.mockResolvedValue({ ...mockFile, name: specialName } as any);

      await request(app.getHttpServer())
        .post('/documents/files')
        .set('Authorization', 'Bearer valid-token')
        .send({
          name: specialName,
          filePath: '/uploads/test.pdf',
          mimeType: 'application/pdf',
          size: 1024,
        })
        .expect(201);
    });

    it('should handle very large file sizes', async () => {
      const largeFile = { ...mockFile, size: 5000000000 }; // 5GB
      documentService.createFile.mockResolvedValue(largeFile as any);

      await request(app.getHttpServer())
        .post('/documents/files')
        .set('Authorization', 'Bearer valid-token')
        .send({
          name: 'large-file.zip',
          filePath: '/uploads/large-file.zip',
          mimeType: 'application/zip',
          size: 5000000000,
        })
        .expect(201);
    });

    it('should handle circular parent references gracefully', async () => {
      documentService.createFolder.mockRejectedValue(
        new HttpException('Circular reference detected', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .post('/documents/folders')
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'Circular', parentId: 'folder-123', uploadedBy: 'user-123' })
        .expect(400);
    });

    it('should handle empty parentId string', async () => {
      documentService.findAll.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/documents?parentId=')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });

    it('should handle multiple versions correctly', async () => {
      const versions = Array.from({ length: 10 }, (_, i) => ({
        ...mockFile,
        version: i + 1,
      }));

      documentService.findById.mockResolvedValue(mockFile as any);
      documentService.findVersions.mockResolvedValue(versions as any);

      const response = await request(app.getHttpServer())
        .get('/documents/file-123/versions')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toHaveLength(10);
    });
  });
});
