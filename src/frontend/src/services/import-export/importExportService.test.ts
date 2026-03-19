import importExportService from './importExportService';
import api from './api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./api');

const mockApiGet = vi.mocked(api.get);
const mockApiPost = vi.mocked(api.post);

describe('importExportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports products, customers, suppliers, and templates as blobs', async () => {
    const blob = new Blob(['test'], { type: 'application/octet-stream' });
    mockApiGet.mockResolvedValueOnce({ data: blob });
    mockApiGet.mockResolvedValueOnce({ data: blob });
    mockApiGet.mockResolvedValueOnce({ data: blob });
    mockApiGet.mockResolvedValueOnce({ data: blob });

    const products = await importExportService.exportProducts('csv');
    const customers = await importExportService.exportCustomers();
    const suppliers = await importExportService.exportSuppliers('excel');
    const template = await importExportService.downloadTemplate('products');

    expect(api.get).toHaveBeenNthCalledWith(1, '/import-export/export/products?format=csv', {
      responseType: 'blob',
    });
    expect(api.get).toHaveBeenNthCalledWith(
      2,
      '/import-export/export/customers?format=excel',
      { responseType: 'blob' },
    );
    expect(api.get).toHaveBeenNthCalledWith(
      3,
      '/import-export/export/suppliers?format=excel',
      { responseType: 'blob' },
    );
    expect(api.get).toHaveBeenNthCalledWith(4, '/import-export/template/products', {
      responseType: 'blob',
    });
    expect(products).toEqual(blob);
    expect(customers).toEqual(blob);
    expect(suppliers).toEqual(blob);
    expect(template).toEqual(blob);
  });

  it('validates and imports data with multipart form data', async () => {
    const file = new File(['name,code'], 'products.csv', { type: 'text/csv' });
    const validateResult = {
      success: true,
      message: 'Validated',
      totalRows: 1,
      successCount: 1,
      errorCount: 0,
      errors: [],
    };
    const importResult = {
      success: true,
      message: 'Imported',
      totalRows: 1,
      successCount: 1,
      errorCount: 0,
      errors: [],
    };
    let progressCallback: ((progressEvent: { loaded: number; total?: number }) => void) | undefined;
    mockApiPost.mockResolvedValueOnce({ data: validateResult });
    mockApiPost.mockImplementationOnce(async (_url, _body, config) => {
      progressCallback = config?.onUploadProgress as
        | ((progressEvent: { loaded: number; total?: number }) => void)
        | undefined;
      return { data: importResult };
    });

    const validated = await importExportService.validateImport('products', file);
    const onProgress = vi.fn();
    const imported = await importExportService.importData('products', file, onProgress);
    progressCallback?.({ loaded: 25, total: 100 });

    expect(api.post).toHaveBeenNthCalledWith(
      1,
      '/import-export/import/products/validate',
      expect.any(FormData),
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );
    expect(api.post).toHaveBeenNthCalledWith(
      2,
      '/import-export/import/products',
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: expect.any(Function),
      }),
    );
    expect(validated).toEqual(validateResult);
    expect(imported).toEqual(importResult);
    expect(onProgress).toHaveBeenCalledWith(25);
  });

  it('downloads a blob through a temporary anchor element', () => {
    const blob = new Blob(['content'], { type: 'text/plain' });
    const createObjectURL = vi.fn(() => 'blob:url');
    const revokeObjectURL = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    const anchor = originalCreateElement('a');
    const click = vi.spyOn(anchor, 'click').mockImplementation(() => {});
    const appendChild = vi.spyOn(document.body, 'appendChild');
    const removeChild = vi.spyOn(document.body, 'removeChild');
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'a') {
        return anchor;
      }
      return originalCreateElement(tagName);
    });

    Object.defineProperty(window, 'URL', {
      configurable: true,
      value: {
        createObjectURL,
        revokeObjectURL,
      },
    });

    importExportService.downloadBlob(blob, 'products.csv');

    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(click).toHaveBeenCalled();
    expect(appendChild).toHaveBeenCalled();
    expect(removeChild).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:url');

    createElementSpy.mockRestore();
    click.mockRestore();
    appendChild.mockRestore();
    removeChild.mockRestore();
  });
});
