import { Test, TestingModule } from '@nestjs/testing';
import { ImportExportController } from './import-export.controller';
import { ImportExportService } from './import-export.service';
import { User } from '@/common/security/permission.service';
import { Response } from 'express';

describe('ImportExportController', () => {
  let controller: ImportExportController;
  let service: ImportExportService;

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    roles: [],
  };

  const mockImportExportService = {
    exportToCSV: jest.fn(),
    importFromCSV: jest.fn(),
  };

  const mockResponse = {
    setHeader: jest.fn(),
    send: jest.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImportExportController],
      providers: [
        {
          provide: ImportExportService,
          useValue: mockImportExportService,
        },
      ],
    }).compile();

    controller = module.get<ImportExportController>(ImportExportController);
    service = module.get<ImportExportService>(ImportExportService);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /import-export/export/csv', () => {
    it('should export data to CSV successfully', async () => {
      const entityType = 'Product';
      const data = [
        { id: '1', name: 'Product 1', price: 100 },
        { id: '2', name: 'Product 2', price: 200 },
      ];

      const csvContent = 'id,name,price\n1,Product 1,100\n2,Product 2,200';

      mockImportExportService.exportToCSV.mockResolvedValue(csvContent);

      await controller.exportToCSV(mockUser, entityType, data, mockResponse);

      expect(mockImportExportService.exportToCSV).toHaveBeenCalledWith(
        mockUser,
        entityType,
        data,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        `attachment; filename=${entityType}.csv`,
      );
      expect(mockResponse.send).toHaveBeenCalledWith(csvContent);
    });

    it('should export empty data to CSV', async () => {
      const entityType = 'Customer';
      const data: Record<string, unknown>[] = [];
      const csvContent = '';

      mockImportExportService.exportToCSV.mockResolvedValue(csvContent);

      await controller.exportToCSV(mockUser, entityType, data, mockResponse);

      expect(mockImportExportService.exportToCSV).toHaveBeenCalledWith(
        mockUser,
        entityType,
        data,
      );
      expect(mockResponse.send).toHaveBeenCalledWith(csvContent);
    });

    it('should export single record to CSV', async () => {
      const entityType = 'Invoice';
      const data = [{ id: '1', number: 'INV-001', amount: 1000 }];
      const csvContent = 'id,number,amount\n1,INV-001,1000';

      mockImportExportService.exportToCSV.mockResolvedValue(csvContent);

      await controller.exportToCSV(mockUser, entityType, data, mockResponse);

      expect(mockImportExportService.exportToCSV).toHaveBeenCalledWith(
        mockUser,
        entityType,
        data,
      );
      expect(mockResponse.send).toHaveBeenCalledWith(csvContent);
    });

    it('should export large dataset to CSV', async () => {
      const entityType = 'Order';
      const data = Array(1000)
        .fill(null)
        .map((_, i) => ({
          id: `${i + 1}`,
          orderNumber: `ORD-${i + 1}`,
          total: (i + 1) * 100,
        }));

      const csvContent = 'id,orderNumber,total\n' + data.map(d => `${d.id},${d.orderNumber},${d.total}`).join('\n');

      mockImportExportService.exportToCSV.mockResolvedValue(csvContent);

      await controller.exportToCSV(mockUser, entityType, data, mockResponse);

      expect(mockImportExportService.exportToCSV).toHaveBeenCalledWith(
        mockUser,
        entityType,
        data,
      );
      expect(mockResponse.send).toHaveBeenCalledWith(csvContent);
    });

    it('should handle special characters in data', async () => {
      const entityType = 'Product';
      const data = [
        { id: '1', name: 'Product, with comma', description: 'Line1\nLine2' },
        { id: '2', name: 'Product "quoted"', description: 'Test' },
      ];

      const csvContent = 'id,name,description\n1,"Product, with comma","Line1\nLine2"\n2,"Product ""quoted""",Test';

      mockImportExportService.exportToCSV.mockResolvedValue(csvContent);

      await controller.exportToCSV(mockUser, entityType, data, mockResponse);

      expect(mockImportExportService.exportToCSV).toHaveBeenCalledWith(
        mockUser,
        entityType,
        data,
      );
      expect(mockResponse.send).toHaveBeenCalledWith(csvContent);
    });

    it('should handle nested objects in data', async () => {
      const entityType = 'Order';
      const data = [
        {
          id: '1',
          customer: { name: 'John Doe', email: 'john@test.com' },
          items: [{ product: 'A', qty: 2 }],
        },
      ];

      const csvContent = 'id,customer,items\n1,"{""name"":""John Doe"",""email"":""john@test.com""}","[{""product"":""A"",""qty"":2}]"';

      mockImportExportService.exportToCSV.mockResolvedValue(csvContent);

      await controller.exportToCSV(mockUser, entityType, data, mockResponse);

      expect(mockImportExportService.exportToCSV).toHaveBeenCalledWith(
        mockUser,
        entityType,
        data,
      );
    });

    it('should set correct filename for different entity types', async () => {
      const entityTypes = ['Product', 'Customer', 'Invoice', 'Order'];

      for (const entityType of entityTypes) {
        jest.clearAllMocks();
        mockImportExportService.exportToCSV.mockResolvedValue('test');

        await controller.exportToCSV(mockUser, entityType, [], mockResponse);

        expect(mockResponse.setHeader).toHaveBeenCalledWith(
          'Content-Disposition',
          `attachment; filename=${entityType}.csv`,
        );
      }
    });

    it('should handle service errors during export', async () => {
      const entityType = 'Product';
      const data = [{ id: '1', name: 'Test' }];
      const error = new Error('Export failed');

      mockImportExportService.exportToCSV.mockRejectedValue(error);

      await expect(
        controller.exportToCSV(mockUser, entityType, data, mockResponse),
      ).rejects.toThrow(error);
    });

    it('should handle null values in data', async () => {
      const entityType = 'Product';
      const data = [
        { id: '1', name: 'Product 1', description: null },
        { id: '2', name: null, description: 'Test' },
      ];

      const csvContent = 'id,name,description\n1,Product 1,\n2,,Test';

      mockImportExportService.exportToCSV.mockResolvedValue(csvContent);

      await controller.exportToCSV(mockUser, entityType, data, mockResponse);

      expect(mockImportExportService.exportToCSV).toHaveBeenCalledWith(
        mockUser,
        entityType,
        data,
      );
    });

    it('should handle undefined values in data', async () => {
      const entityType = 'Product';
      const data = [
        { id: '1', name: 'Product 1', price: undefined },
      ];

      const csvContent = 'id,name,price\n1,Product 1,';

      mockImportExportService.exportToCSV.mockResolvedValue(csvContent);

      await controller.exportToCSV(mockUser, entityType, data, mockResponse);

      expect(mockImportExportService.exportToCSV).toHaveBeenCalledWith(
        mockUser,
        entityType,
        data,
      );
    });

    it('should handle data with different column sets', async () => {
      const entityType = 'Product';
      const data = [
        { id: '1', name: 'Product 1', price: 100 },
        { id: '2', name: 'Product 2', category: 'Electronics' },
      ];

      const csvContent = 'id,name,price,category\n1,Product 1,100,\n2,Product 2,,Electronics';

      mockImportExportService.exportToCSV.mockResolvedValue(csvContent);

      await controller.exportToCSV(mockUser, entityType, data, mockResponse);

      expect(mockImportExportService.exportToCSV).toHaveBeenCalledWith(
        mockUser,
        entityType,
        data,
      );
    });
  });

  describe('POST /import-export/import/csv', () => {
    it('should import data from CSV successfully', async () => {
      const entityType = 'Product';
      const csvContent = 'id,name,price\n1,Product 1,100\n2,Product 2,200';

      const expectedData = [
        { id: '1', name: 'Product 1', price: '100' },
        { id: '2', name: 'Product 2', price: '200' },
      ];

      mockImportExportService.importFromCSV.mockResolvedValue(expectedData);

      const result = await controller.importFromCSV(mockUser, entityType, csvContent);

      expect(result).toEqual(expectedData);
      expect(mockImportExportService.importFromCSV).toHaveBeenCalledWith(
        mockUser,
        entityType,
        csvContent,
      );
      expect(mockImportExportService.importFromCSV).toHaveBeenCalledTimes(1);
    });

    it('should import empty CSV', async () => {
      const entityType = 'Customer';
      const csvContent = '';
      const expectedData: Record<string, unknown>[] = [];

      mockImportExportService.importFromCSV.mockResolvedValue(expectedData);

      const result = await controller.importFromCSV(mockUser, entityType, csvContent);

      expect(result).toEqual(expectedData);
      expect(mockImportExportService.importFromCSV).toHaveBeenCalledWith(
        mockUser,
        entityType,
        csvContent,
      );
    });

    it('should import CSV with headers only', async () => {
      const entityType = 'Invoice';
      const csvContent = 'id,number,amount';
      const expectedData: Record<string, unknown>[] = [];

      mockImportExportService.importFromCSV.mockResolvedValue(expectedData);

      const result = await controller.importFromCSV(mockUser, entityType, csvContent);

      expect(result).toEqual(expectedData);
    });

    it('should import single record from CSV', async () => {
      const entityType = 'Order';
      const csvContent = 'id,orderNumber,total\n1,ORD-001,1000';

      const expectedData = [{ id: '1', orderNumber: 'ORD-001', total: '1000' }];

      mockImportExportService.importFromCSV.mockResolvedValue(expectedData);

      const result = await controller.importFromCSV(mockUser, entityType, csvContent);

      expect(result).toEqual(expectedData);
      expect(result).toHaveLength(1);
    });

    it('should import large CSV dataset', async () => {
      const entityType = 'Product';
      const rows = Array(1000)
        .fill(null)
        .map((_, i) => `${i + 1},Product ${i + 1},${(i + 1) * 100}`);
      const csvContent = 'id,name,price\n' + rows.join('\n');

      const expectedData = Array(1000)
        .fill(null)
        .map((_, i) => ({
          id: `${i + 1}`,
          name: `Product ${i + 1}`,
          price: `${(i + 1) * 100}`,
        }));

      mockImportExportService.importFromCSV.mockResolvedValue(expectedData);

      const result = await controller.importFromCSV(mockUser, entityType, csvContent);

      expect(result).toHaveLength(1000);
      expect(mockImportExportService.importFromCSV).toHaveBeenCalledWith(
        mockUser,
        entityType,
        csvContent,
      );
    });

    it('should handle CSV with special characters', async () => {
      const entityType = 'Product';
      const csvContent = 'id,name,description\n1,"Product, with comma","Line1\nLine2"\n2,"Product ""quoted""",Test';

      const expectedData = [
        { id: '1', name: 'Product, with comma', description: 'Line1\nLine2' },
        { id: '2', name: 'Product "quoted"', description: 'Test' },
      ];

      mockImportExportService.importFromCSV.mockResolvedValue(expectedData);

      const result = await controller.importFromCSV(mockUser, entityType, csvContent);

      expect(result).toEqual(expectedData);
    });

    it('should handle CSV with missing values', async () => {
      const entityType = 'Product';
      const csvContent = 'id,name,price\n1,Product 1,\n2,,200';

      const expectedData = [
        { id: '1', name: 'Product 1', price: '' },
        { id: '2', name: '', price: '200' },
      ];

      mockImportExportService.importFromCSV.mockResolvedValue(expectedData);

      const result = await controller.importFromCSV(mockUser, entityType, csvContent);

      expect(result).toEqual(expectedData);
    });

    it('should handle CSV with extra columns', async () => {
      const entityType = 'Product';
      const csvContent = 'id,name,price,category,brand\n1,Product 1,100,Electronics,BrandA';

      const expectedData = [
        { id: '1', name: 'Product 1', price: '100', category: 'Electronics', brand: 'BrandA' },
      ];

      mockImportExportService.importFromCSV.mockResolvedValue(expectedData);

      const result = await controller.importFromCSV(mockUser, entityType, csvContent);

      expect(result).toEqual(expectedData);
    });

    it('should handle malformed CSV', async () => {
      const entityType = 'Product';
      const csvContent = 'id,name,price\n1,Product 1\n2,Product 2,200,extra';

      const error = new Error('Malformed CSV');
      mockImportExportService.importFromCSV.mockRejectedValue(error);

      await expect(
        controller.importFromCSV(mockUser, entityType, csvContent),
      ).rejects.toThrow(error);
    });

    it('should handle invalid entity type', async () => {
      const entityType = 'InvalidType';
      const csvContent = 'id,name\n1,Test';

      const error = new Error('Invalid entity type');
      mockImportExportService.importFromCSV.mockRejectedValue(error);

      await expect(
        controller.importFromCSV(mockUser, entityType, csvContent),
      ).rejects.toThrow(error);
    });

    it('should handle service errors during import', async () => {
      const entityType = 'Product';
      const csvContent = 'id,name,price\n1,Product 1,100';
      const error = new Error('Import failed');

      mockImportExportService.importFromCSV.mockRejectedValue(error);

      await expect(
        controller.importFromCSV(mockUser, entityType, csvContent),
      ).rejects.toThrow(error);
    });

    it('should handle CSV with BOM (Byte Order Mark)', async () => {
      const entityType = 'Product';
      const csvContent = '\uFEFFid,name,price\n1,Product 1,100';

      const expectedData = [{ id: '1', name: 'Product 1', price: '100' }];

      mockImportExportService.importFromCSV.mockResolvedValue(expectedData);

      const result = await controller.importFromCSV(mockUser, entityType, csvContent);

      expect(result).toEqual(expectedData);
    });

    it('should handle CSV with different line endings', async () => {
      const entityType = 'Product';
      const csvContent = 'id,name,price\r\n1,Product 1,100\r\n2,Product 2,200';

      const expectedData = [
        { id: '1', name: 'Product 1', price: '100' },
        { id: '2', name: 'Product 2', price: '200' },
      ];

      mockImportExportService.importFromCSV.mockResolvedValue(expectedData);

      const result = await controller.importFromCSV(mockUser, entityType, csvContent);

      expect(result).toEqual(expectedData);
    });

    it('should handle CSV with Unicode characters', async () => {
      const entityType = 'Product';
      const csvContent = 'id,name,price\n1,Sản phẩm 1,100\n2,产品 2,200';

      const expectedData = [
        { id: '1', name: 'Sản phẩm 1', price: '100' },
        { id: '2', name: '产品 2', price: '200' },
      ];

      mockImportExportService.importFromCSV.mockResolvedValue(expectedData);

      const result = await controller.importFromCSV(mockUser, entityType, csvContent);

      expect(result).toEqual(expectedData);
    });

    it('should handle CSV with numeric values', async () => {
      const entityType = 'Product';
      const csvContent = 'id,name,price,quantity\n1,Product 1,99.99,10\n2,Product 2,199.99,5';

      const expectedData = [
        { id: '1', name: 'Product 1', price: '99.99', quantity: '10' },
        { id: '2', name: 'Product 2', price: '199.99', quantity: '5' },
      ];

      mockImportExportService.importFromCSV.mockResolvedValue(expectedData);

      const result = await controller.importFromCSV(mockUser, entityType, csvContent);

      expect(result).toEqual(expectedData);
    });

    it('should handle CSV with boolean values', async () => {
      const entityType = 'Product';
      const csvContent = 'id,name,active,featured\n1,Product 1,true,false\n2,Product 2,false,true';

      const expectedData = [
        { id: '1', name: 'Product 1', active: 'true', featured: 'false' },
        { id: '2', name: 'Product 2', active: 'false', featured: 'true' },
      ];

      mockImportExportService.importFromCSV.mockResolvedValue(expectedData);

      const result = await controller.importFromCSV(mockUser, entityType, csvContent);

      expect(result).toEqual(expectedData);
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle null user', async () => {
      const entityType = 'Product';
      const data = [{ id: '1', name: 'Test' }];

      mockImportExportService.exportToCSV.mockRejectedValue(new Error('User is required'));

      await expect(
        controller.exportToCSV(null as any, entityType, data, mockResponse),
      ).rejects.toThrow();
    });

    it('should handle undefined entity type', async () => {
      const data = [{ id: '1', name: 'Test' }];

      mockImportExportService.exportToCSV.mockRejectedValue(
        new Error('Entity type is required'),
      );

      await expect(
        controller.exportToCSV(mockUser, undefined as any, data, mockResponse),
      ).rejects.toThrow();
    });

    it('should handle null data array', async () => {
      const entityType = 'Product';

      mockImportExportService.exportToCSV.mockRejectedValue(new Error('Data is required'));

      await expect(
        controller.exportToCSV(mockUser, entityType, null as any, mockResponse),
      ).rejects.toThrow();
    });

    it('should handle undefined CSV content', async () => {
      const entityType = 'Product';

      mockImportExportService.importFromCSV.mockRejectedValue(
        new Error('CSV content is required'),
      );

      await expect(
        controller.importFromCSV(mockUser, entityType, undefined as any),
      ).rejects.toThrow();
    });

    it('should handle concurrent export requests', async () => {
      const entityType = 'Product';
      const data = [{ id: '1', name: 'Test' }];
      const csvContent = 'id,name\n1,Test';

      mockImportExportService.exportToCSV.mockResolvedValue(csvContent);

      const promises = Array(10)
        .fill(null)
        .map(() => controller.exportToCSV(mockUser, entityType, data, mockResponse));

      await Promise.all(promises);

      expect(mockImportExportService.exportToCSV).toHaveBeenCalledTimes(10);
    });

    it('should handle concurrent import requests', async () => {
      const entityType = 'Product';
      const csvContent = 'id,name\n1,Test';
      const expectedData = [{ id: '1', name: 'Test' }];

      mockImportExportService.importFromCSV.mockResolvedValue(expectedData);

      const promises = Array(10)
        .fill(null)
        .map(() => controller.importFromCSV(mockUser, entityType, csvContent));

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      expect(mockImportExportService.importFromCSV).toHaveBeenCalledTimes(10);
    });

    it('should handle service timeout during export', async () => {
      const entityType = 'Product';
      const data = [{ id: '1', name: 'Test' }];
      const error = new Error('Service timeout');

      mockImportExportService.exportToCSV.mockRejectedValue(error);

      await expect(
        controller.exportToCSV(mockUser, entityType, data, mockResponse),
      ).rejects.toThrow('Service timeout');
    });

    it('should handle service timeout during import', async () => {
      const entityType = 'Product';
      const csvContent = 'id,name\n1,Test';
      const error = new Error('Service timeout');

      mockImportExportService.importFromCSV.mockRejectedValue(error);

      await expect(
        controller.importFromCSV(mockUser, entityType, csvContent),
      ).rejects.toThrow('Service timeout');
    });

    it('should handle very large CSV content', async () => {
      const entityType = 'Product';
      const rows = Array(10000)
        .fill(null)
        .map((_, i) => `${i + 1},Product ${i + 1},${(i + 1) * 100}`);
      const csvContent = 'id,name,price\n' + rows.join('\n');

      const expectedData = Array(10000)
        .fill(null)
        .map((_, i) => ({
          id: `${i + 1}`,
          name: `Product ${i + 1}`,
          price: `${(i + 1) * 100}`,
        }));

      mockImportExportService.importFromCSV.mockResolvedValue(expectedData);

      const result = await controller.importFromCSV(mockUser, entityType, csvContent);

      expect(result).toHaveLength(10000);
    });

    it('should handle response object errors during export', async () => {
      const entityType = 'Product';
      const data = [{ id: '1', name: 'Test' }];
      const csvContent = 'id,name\n1,Test';

      mockImportExportService.exportToCSV.mockResolvedValue(csvContent);
      (mockResponse.send as jest.Mock).mockImplementation(() => {
        throw new Error('Response send failed');
      });

      await expect(
        controller.exportToCSV(mockUser, entityType, data, mockResponse),
      ).rejects.toThrow('Response send failed');
    });

    it('should handle empty entity type string', async () => {
      const entityType = '';
      const data = [{ id: '1', name: 'Test' }];

      mockImportExportService.exportToCSV.mockRejectedValue(
        new Error('Entity type cannot be empty'),
      );

      await expect(
        controller.exportToCSV(mockUser, entityType, data, mockResponse),
      ).rejects.toThrow();
    });

    it('should handle data with circular references', async () => {
      const entityType = 'Product';
      const circularData: any = { id: '1', name: 'Test' };
      circularData.self = circularData;

      mockImportExportService.exportToCSV.mockRejectedValue(
        new Error('Cannot serialize circular reference'),
      );

      await expect(
        controller.exportToCSV(mockUser, entityType, [circularData], mockResponse),
      ).rejects.toThrow();
    });
  });
});
