import api from './api';

export interface Document {
  id: string;
  tenantId: string;
  name: string;
  type: 'file' | 'folder';
  filePath?: string;
  mimeType?: string;
  size?: number;
  version: number;
  parentId?: string;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface CreateFolderDto {
  name: string;
  parentId?: string;
  uploadedBy: string;
}

export interface CreateFileDto {
  name: string;
  filePath: string;
  mimeType: string;
  size: number;
  parentId?: string;
  uploadedBy: string;
}

export interface UpdateDocumentDto {
  name?: string;
  parentId?: string;
}

const documentService = {
  async getAll(parentId?: string): Promise<Document[]> {
    const params = parentId ? { parentId } : undefined;
    const response = await api.get('/documents', { params });
    return response.data;
  },

  async search(query: string): Promise<Document[]> {
    const response = await api.get('/documents/search', { params: { q: query } });
    return response.data;
  },

  async getById(id: string): Promise<Document> {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },

  async getVersions(id: string): Promise<Document[]> {
    const response = await api.get(`/documents/${id}/versions`);
    return response.data;
  },

  async createFolder(data: CreateFolderDto): Promise<Document> {
    const response = await api.post('/documents/folders', data);
    return response.data;
  },

  async createFile(data: CreateFileDto): Promise<Document> {
    const response = await api.post('/documents/files', data);
    return response.data;
  },

  async createVersion(id: string, filePath: string, uploadedBy: string): Promise<Document> {
    const response = await api.post(`/documents/${id}/versions`, { filePath, uploadedBy });
    return response.data;
  },

  async update(id: string, data: UpdateDocumentDto): Promise<Document> {
    const response = await api.put(`/documents/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/documents/${id}`);
  },
};

export default documentService;
