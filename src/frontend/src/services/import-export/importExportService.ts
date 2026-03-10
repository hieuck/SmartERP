import api from './api';

export interface ImportResult {
  success: boolean;
  message: string;
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  errorReport?: string;
}

const importExportService = {
  // Export functions
  exportProducts: async (format: 'excel' | 'csv' = 'excel'): Promise<Blob> => {
    const response = await api.get(`/import-export/export/products?format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  exportCustomers: async (format: 'excel' | 'csv' = 'excel'): Promise<Blob> => {
    const response = await api.get(`/import-export/export/customers?format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  exportSuppliers: async (format: 'excel' | 'csv' = 'excel'): Promise<Blob> => {
    const response = await api.get(`/import-export/export/suppliers?format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Download template
  downloadTemplate: async (type: 'products' | 'customers' | 'suppliers'): Promise<Blob> => {
    const response = await api.get(`/import-export/template/${type}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Validate import
  validateImport: async (
    type: 'products' | 'customers' | 'suppliers',
    file: File,
  ): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/import-export/import/${type}/validate`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Import data
  importData: async (
    type: 'products' | 'customers' | 'suppliers',
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/import-export/import/${type}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
    return response.data;
  },

  // Helper to download blob as file
  downloadBlob: (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

export default importExportService;

export default importExportService;
