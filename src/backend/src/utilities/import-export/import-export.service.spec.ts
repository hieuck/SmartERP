import { Test, TestingModule } from '@nestjs/testing';
import { ImportExportService } from './import-export.service';
import { User } from '@/common/security/permission.service';

describe('ImportExportService', () => {
  let service: ImportExportService;

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    roles: ['admin'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImportExportService],
    }).compile();

    service = module.get<ImportExportService>(ImportExportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('exportToExcel', () => {
    it('should export data to Excel buffer', async () => {
      const data = [
        { id: 1, name: 'Product 1', price: 100 },
        { id: 2, name: 'Product 2', price: 200 },
      ];

      const result = await service.exportToExcel(mockUser, 'products', data);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe('Excel export placeholder');
    });

    it('should handle empty data array', async () => {
      const result = await service.exportToExcel(mockUser, 'products', []);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle single record', async () => {
      const data = [{ id: 1, name: 'Product 1' }];

      const result = await service.exportToExcel(mockUser, 'products', data);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle large dataset', async () => {
      const data = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Product ${i}`,
      }));

      const result = await service.exportToExcel(mockUser, 'products', data);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle different entity types', async () => {
      const data = [{ id: 1, email: 'user@example.com' }];

      const result = await service.exportToExcel(mockUser, 'users', data);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle data with nested objects', async () => {
      const data = [{ id: 1, name: 'Product', details: { color: 'red', size: 'M' } }];

      const result = await service.exportToExcel(mockUser, 'products', data);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle data with null values', async () => {
      const data = [{ id: 1, name: 'Product', description: null }];

      const result = await service.exportToExcel(mockUser, 'products', data);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle data with undefined values', async () => {
      const data = [{ id: 1, name: 'Product', description: undefined }];

      const result = await service.exportToExcel(mockUser, 'products', data);

      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('exportToCSV', () => {
    it('should export data to CSV string', async () => {
      const data = [
        { id: 1, name: 'Product 1', price: 100 },
        { id: 2, name: 'Product 2', price: 200 },
      ];

      const result = await service.exportToCSV(mockUser, 'products', data);

      expect(result).toContain('id,name,price');
      expect(result).toContain('1,Product 1,100');
      expect(result).toContain('2,Product 2,200');
    });

    it('should return empty string for empty data', async () => {
      const result = await service.exportToCSV(mockUser, 'products', []);

      expect(result).toBe('');
    });

    it('should handle single record', async () => {
      const data = [{ id: 1, name: 'Product 1' }];

      const result = await service.exportToCSV(mockUser, 'products', data);

      expect(result).toBe('id,name\n1,Product 1');
    });

    it('should handle data with special characters', async () => {
      const data = [{ id: 1, name: 'Product, Special' }];

      const result = await service.exportToCSV(mockUser, 'products', data);

      expect(result).toContain('Product, Special');
    });

    it('should handle data with quotes', async () => {
      const data = [{ id: 1, name: 'Product "Best"' }];

      const result = await service.exportToCSV(mockUser, 'products', data);

      expect(result).toContain('Product "Best"');
    });

    it('should handle data with newlines', async () => {
      const data = [{ id: 1, name: 'Product\nMultiline' }];

      const result = await service.exportToCSV(mockUser, 'products', data);

      expect(result).toContain('Product\nMultiline');
    });

    it('should handle numeric values', async () => {
      const data = [{ id: 1, price: 99.99 }];

      const result = await service.exportToCSV(mockUser, 'products', data);

      expect(result).toContain('99.99');
    });
  });

  describe('importFromExcel', () => {
    it('should import data from Excel buffer', async () => {
      const buffer = Buffer.from('Excel data');

      const result = await service.importFromExcel(mockUser, 'products', buffer);

      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle empty buffer', async () => {
      const buffer = Buffer.from('');

      const result = await service.importFromExcel(mockUser, 'products', buffer);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('importFromCSV', () => {
    it('should import data from CSV string', async () => {
      const csv = 'id,name,price\n1,Product 1,100\n2,Product 2,200';

      const result = await service.importFromCSV(mockUser, 'products', csv);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle empty CSV', async () => {
      const result = await service.importFromCSV(mockUser, 'products', '');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle CSV with headers only', async () => {
      const csv = 'id,name,price';

      const result = await service.importFromCSV(mockUser, 'products', csv);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });
});
