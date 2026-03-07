import { Test, TestingModule } from '@nestjs/testing';
import { ImportExportService } from './import-export.service';
import { createMockUser } from '@/common/test/test-helpers';

describe('ImportExportService', () => {
  let service: ImportExportService;

  const mockTenantId = 'tenant-123';

  const mockUser = createMockUser();
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImportExportService],
    }).compile();

    service = module.get<ImportExportService>(ImportExportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('exportToExcel', () => {
    it('should export data to Excel buffer', async () => {
      const data = [
        { id: '1', name: 'Product 1', price: 100 },
        { id: '2', name: 'Product 2', price: 200 },
      ];

      const result = await service.exportToExcel(mockUser, 'products', data);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle empty data array', async () => {
      const result = await service.exportToExcel(mockUser, 'products', []);

      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('exportToCSV', () => {
    it('should export data to CSV string', async () => {
      const data = [
        { id: '1', name: 'Product 1', price: 100 },
        { id: '2', name: 'Product 2', price: 200 },
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

    it('should handle data with different fields', async () => {
      const data = [
        { sku: 'SKU001', quantity: 10 },
        { sku: 'SKU002', quantity: 20 },
      ];

      const result = await service.exportToCSV(mockUser, 'inventory', data);

      expect(result).toContain('sku,quantity');
      expect(result).toContain('SKU001,10');
    });
  });

  describe('importFromExcel', () => {
    it('should import data from Excel buffer', async () => {
      const buffer = Buffer.from('Excel file content');

      const result = await service.importFromExcel(mockUser, 'products', buffer);

      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle empty Excel file', async () => {
      const buffer = Buffer.from('');

      const result = await service.importFromExcel(mockUser, 'products', buffer);

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('importFromCSV', () => {
    it('should import data from CSV string', async () => {
      const csvContent = 'id,name,price\n1,Product 1,100\n2,Product 2,200';

      const result = await service.importFromCSV(mockUser, 'products', csvContent);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: '1', name: 'Product 1', price: '100' });
      expect(result[1]).toEqual({ id: '2', name: 'Product 2', price: '200' });
    });

    it('should handle CSV with only headers', async () => {
      const csvContent = 'id,name,price';

      const result = await service.importFromCSV(mockUser, 'products', csvContent);

      expect(result).toHaveLength(0);
    });

    it('should handle empty CSV content', async () => {
      const csvContent = '';

      const result = await service.importFromCSV(mockUser, 'products', csvContent);

      expect(result).toHaveLength(0);
    });

    it('should parse CSV with multiple rows correctly', async () => {
      const csvContent = 'sku,quantity,location\nSKU001,10,A1\nSKU002,20,B2\nSKU003,30,C3';

      const result = await service.importFromCSV(mockUser, 'inventory', csvContent);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ sku: 'SKU001', quantity: '10', location: 'A1' });
      expect(result[2]).toEqual({ sku: 'SKU003', quantity: '30', location: 'C3' });
    });
  });
});
