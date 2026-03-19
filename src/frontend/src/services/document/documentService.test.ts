import documentService, {
  type CreateFileDto,
  type CreateFolderDto,
  type UpdateDocumentDto,
} from './documentService';
import api from './api';
import { vi } from 'vitest';

vi.mock('./api');

const mockApiGet = vi.mocked(api.get);
const mockApiPost = vi.mocked(api.post);
const mockApiPut = vi.mocked(api.put);
const mockApiDelete = vi.mocked(api.delete);

describe('documentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gets documents with optional parentId filtering', async () => {
    const rootDocs = [{ id: 'doc-1', name: 'Root Folder', type: 'folder' }];
    const childDocs = [{ id: 'doc-2', name: 'Child File', type: 'file' }];
    mockApiGet.mockResolvedValueOnce({ data: rootDocs });
    mockApiGet.mockResolvedValueOnce({ data: childDocs });

    const rootResult = await documentService.getAll();
    const childResult = await documentService.getAll('folder-1');

    expect(api.get).toHaveBeenNthCalledWith(1, '/documents', { params: undefined });
    expect(api.get).toHaveBeenNthCalledWith(2, '/documents', { params: { parentId: 'folder-1' } });
    expect(rootResult).toEqual(rootDocs);
    expect(childResult).toEqual(childDocs);
  });

  it('searches documents and gets document details', async () => {
    const searchResults = [{ id: 'doc-1', name: 'Invoice 001.pdf' }];
    const document = { id: 'doc-1', name: 'Invoice 001.pdf', version: 3 };
    const versions = [{ id: 'doc-v1', version: 1 }, { id: 'doc-v2', version: 2 }];
    mockApiGet.mockResolvedValueOnce({ data: searchResults });
    mockApiGet.mockResolvedValueOnce({ data: document });
    mockApiGet.mockResolvedValueOnce({ data: versions });

    const searchResult = await documentService.search('invoice');
    const documentResult = await documentService.getById('doc-1');
    const versionsResult = await documentService.getVersions('doc-1');

    expect(api.get).toHaveBeenNthCalledWith(1, '/documents/search', { params: { q: 'invoice' } });
    expect(api.get).toHaveBeenNthCalledWith(2, '/documents/doc-1');
    expect(api.get).toHaveBeenNthCalledWith(3, '/documents/doc-1/versions');
    expect(searchResult).toEqual(searchResults);
    expect(documentResult).toEqual(document);
    expect(versionsResult).toEqual(versions);
  });

  it('creates folders, files, and versions', async () => {
    const folderPayload: CreateFolderDto = {
      name: 'Invoices',
      parentId: 'root',
      uploadedBy: 'user-1',
    };
    const filePayload: CreateFileDto = {
      name: 'invoice-001.pdf',
      filePath: '/files/invoice-001.pdf',
      mimeType: 'application/pdf',
      size: 1024,
      uploadedBy: 'user-1',
      parentId: 'folder-1',
    };
    const folder = { id: 'folder-1', ...folderPayload, type: 'folder' };
    const file = { id: 'file-1', ...filePayload, type: 'file' };
    const version = { id: 'file-1-v2', version: 2 };
    mockApiPost.mockResolvedValueOnce({ data: folder });
    mockApiPost.mockResolvedValueOnce({ data: file });
    mockApiPost.mockResolvedValueOnce({ data: version });

    const folderResult = await documentService.createFolder(folderPayload);
    const fileResult = await documentService.createFile(filePayload);
    const versionResult = await documentService.createVersion(
      'file-1',
      '/files/invoice-001-v2.pdf',
      'user-2',
    );

    expect(api.post).toHaveBeenNthCalledWith(1, '/documents/folders', folderPayload);
    expect(api.post).toHaveBeenNthCalledWith(2, '/documents/files', filePayload);
    expect(api.post).toHaveBeenNthCalledWith(3, '/documents/file-1/versions', {
      filePath: '/files/invoice-001-v2.pdf',
      uploadedBy: 'user-2',
    });
    expect(folderResult).toEqual(folder);
    expect(fileResult).toEqual(file);
    expect(versionResult).toEqual(version);
  });

  it('updates and deletes a document', async () => {
    const payload: UpdateDocumentDto = { name: 'Updated Invoice.pdf', parentId: 'folder-2' };
    const updated = { id: 'doc-1', ...payload };
    mockApiPut.mockResolvedValueOnce({ data: updated });
    mockApiDelete.mockResolvedValueOnce({ data: undefined });

    const updateResult = await documentService.update('doc-1', payload);
    await documentService.delete('doc-1');

    expect(api.put).toHaveBeenCalledWith('/documents/doc-1', payload);
    expect(api.delete).toHaveBeenCalledWith('/documents/doc-1');
    expect(updateResult).toEqual(updated);
  });
});
