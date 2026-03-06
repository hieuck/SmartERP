import { Test, TestingModule } from '@nestjs/testing';
import { ImportExportController } from './import-export.controller';
import { ImportExportService } from './import-export.service';
import { Response } from 'express';

describe('ImportExportController', () => {
  let controller: ImportExportController;
  let service: jest.Mocked<ImportExportService>;

  const mockImportExportService = {
    exportToCSV: jest.fn(),
    importFromCSV: jest.fn(),
  };

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
    service = module.get(ImportExportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('exportToCSV', () => {
    it('should export data to CSV', async () => {
      const tenantId = 'tenant-1';
      const entityType = 'products';
      const data = [
        { id: '1', name: 'Product 1', price: 100 },
        { id: '2', name: 'Product 2', price: 200 },
      ];
      const csvContent = 'id,name,price\n1,Product 1,100\n2,Product 2,200';
      
      service.exportToCSV.mockResolvedValue(csvContent);

      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      await controller.exportToCSV(tenantId, entityType, data, mockResponse);

      expect(service.exportToCSV).toHaveBeenCalledWith(tenantId, entityType, data);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        `attachment; filename=${entityType}.csv`,
      );
      expect(mockResponse.send).toHaveBeenCalledWith(csvContent);
    });
  });

  describe('importFromCSV', () => {
    it('should import data from CSV', async () => {
      const tenantId = 'tenant-1';
      const entityType = 'products';
      const csvContent = 'id,name,price\n1,Product 1,100\n2,Product 2,200';
      const expectedData = [
        { id: '1', name: 'Product 1', price: '100' },
        { id: '2', name: 'Product 2', price: '200' },
      ];

      service.importFromCSV.mockResolvedValue(expectedData);

      const result = await controller.importFromCSV(tenantId, entityType, csvContent);

      expect(result).toEqual(expectedData);
      expect(service.importFromCSV).toHaveBeenCalledWith(tenantId, entityType, csvContent);
    });
  });
});
