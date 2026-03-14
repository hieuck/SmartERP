import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportTemplateService, ReportCategory } from './report-template.service';
import { Report } from './entities/report.entity';
import { ReportColumn } from './entities/report-column.entity';
import { ReportType, ChartType } from './enums';
import { User } from '@/common/security/permission.service';

describe('ReportTemplateService', () => {
  let service: ReportTemplateService;
  let reportRepository: jest.Mocked<Repository<Report>>;
  let columnRepository: jest.Mocked<Repository<ReportColumn>>;

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    roles: ['admin'],
  };

  beforeEach(async () => {
    const mockReportRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    const mockColumnRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportTemplateService,
        {
          provide: getRepositoryToken(Report),
          useValue: mockReportRepository,
        },
        {
          provide: getRepositoryToken(ReportColumn),
          useValue: mockColumnRepository,
        },
      ],
    }).compile();

    service = module.get<ReportTemplateService>(ReportTemplateService);
    reportRepository = module.get(getRepositoryToken(Report));
    columnRepository = module.get(getRepositoryToken(ReportColumn));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getStandardTemplates', () => {
    it('should return all standard templates', () => {
      const templates = service.getStandardTemplates();

      expect(templates).toBeDefined();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should return templates with required fields', () => {
      const templates = service.getStandardTemplates();

      templates.forEach((template) => {
        expect(template.name).toBeDefined();
        expect(template.description).toBeDefined();
        expect(template.category).toBeDefined();
        expect(template.type).toBeDefined();
        expect(template.sourceEntity).toBeDefined();
        expect(template.columns).toBeDefined();
        expect(Array.isArray(template.columns)).toBe(true);
      });
    });

    it('should return accounting templates', () => {
      const templates = service.getStandardTemplates();
      const accountingTemplates = templates.filter(
        (t) => t.category === ReportCategory.ACCOUNTING,
      );

      expect(accountingTemplates.length).toBeGreaterThan(0);
      expect(accountingTemplates.some((t) => t.name === 'Balance Sheet')).toBe(true);
      expect(accountingTemplates.some((t) => t.name === 'Profit & Loss Statement')).toBe(true);
    });

    it('should return inventory templates', () => {
      const templates = service.getStandardTemplates();
      const inventoryTemplates = templates.filter(
        (t) => t.category === ReportCategory.INVENTORY,
      );

      expect(inventoryTemplates.length).toBeGreaterThan(0);
      expect(inventoryTemplates.some((t) => t.name === 'Stock Summary')).toBe(true);
    });

    it('should return sales templates', () => {
      const templates = service.getStandardTemplates();
      const salesTemplates = templates.filter((t) => t.category === ReportCategory.SALES);

      expect(salesTemplates.length).toBeGreaterThan(0);
      expect(salesTemplates.some((t) => t.name === 'Sales by Customer')).toBe(true);
    });

    it('should return purchasing templates', () => {
      const templates = service.getStandardTemplates();
      const purchasingTemplates = templates.filter(
        (t) => t.category === ReportCategory.PURCHASING,
      );

      expect(purchasingTemplates.length).toBeGreaterThan(0);
      expect(purchasingTemplates.some((t) => t.name === 'Purchase by Supplier')).toBe(true);
    });

    it('should return HR templates', () => {
      const templates = service.getStandardTemplates();
      const hrTemplates = templates.filter((t) => t.category === ReportCategory.HR);

      expect(hrTemplates.length).toBeGreaterThan(0);
      expect(hrTemplates.some((t) => t.name === 'Employee Attendance Summary')).toBe(true);
    });

    it('should return manufacturing templates', () => {
      const templates = service.getStandardTemplates();
      const manufacturingTemplates = templates.filter(
        (t) => t.category === ReportCategory.MANUFACTURING,
      );

      expect(manufacturingTemplates.length).toBeGreaterThan(0);
      expect(manufacturingTemplates.some((t) => t.name === 'Work Order Status')).toBe(true);
    });

    it('should have valid column definitions', () => {
      const templates = service.getStandardTemplates();

      templates.forEach((template) => {
        template.columns.forEach((column) => {
          expect(column.fieldName).toBeDefined();
          expect(column.label).toBeDefined();
          expect(column.type).toBeDefined();
          expect(column.sequence).toBeDefined();
          expect(typeof column.sequence).toBe('number');
        });
      });
    });

    it('should have chart type for chart reports', () => {
      const templates = service.getStandardTemplates();
      const chartTemplates = templates.filter((t) => t.type === ReportType.CHART);

      chartTemplates.forEach((template) => {
        expect(template.chartType).toBeDefined();
        expect([ChartType.LINE, ChartType.BAR, ChartType.PIE]).toContain(template.chartType);
      });
    });
  });

  describe('getTemplatesByCategory', () => {
    it('should return templates for accounting category', () => {
      const templates = service.getTemplatesByCategory(ReportCategory.ACCOUNTING);

      expect(templates.length).toBeGreaterThan(0);
      templates.forEach((template) => {
        expect(template.category).toBe(ReportCategory.ACCOUNTING);
      });
    });

    it('should return templates for inventory category', () => {
      const templates = service.getTemplatesByCategory(ReportCategory.INVENTORY);

      expect(templates.length).toBeGreaterThan(0);
      templates.forEach((template) => {
        expect(template.category).toBe(ReportCategory.INVENTORY);
      });
    });

    it('should return templates for sales category', () => {
      const templates = service.getTemplatesByCategory(ReportCategory.SALES);

      expect(templates.length).toBeGreaterThan(0);
      templates.forEach((template) => {
        expect(template.category).toBe(ReportCategory.SALES);
      });
    });

    it('should return empty array for non-existent category', () => {
      const templates = service.getTemplatesByCategory('NON_EXISTENT' as ReportCategory);

      expect(templates).toEqual([]);
    });
  });

  describe('getCategories', () => {
    it('should return all report categories', () => {
      const categories = service.getCategories();

      expect(categories).toBeDefined();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
    });

    it('should include all expected categories', () => {
      const categories = service.getCategories();

      expect(categories).toContain(ReportCategory.ACCOUNTING);
      expect(categories).toContain(ReportCategory.INVENTORY);
      expect(categories).toContain(ReportCategory.SALES);
      expect(categories).toContain(ReportCategory.PURCHASING);
      expect(categories).toContain(ReportCategory.HR);
      expect(categories).toContain(ReportCategory.MANUFACTURING);
      expect(categories).toContain(ReportCategory.CRM);
    });
  });

  describe('createFromTemplate', () => {
    it('should create report from template successfully', async () => {
      const mockReport = {
        id: 'report-1',
        name: 'Balance Sheet',
        tenantId: 'tenant-1',
      } as Report;

      const mockColumn = {
        id: 'column-1',
        reportId: 'report-1',
      } as ReportColumn;

      reportRepository.create.mockReturnValue(mockReport as any);
      reportRepository.save.mockResolvedValue(mockReport);
      columnRepository.create.mockReturnValue(mockColumn as any);
      columnRepository.save.mockResolvedValue(mockColumn as any);
      reportRepository.findOne.mockResolvedValue({ 
        ...mockReport, 
        columns: [mockColumn],
        generateReference: jest.fn(),
        validate: jest.fn(),
      } as any);

      const result = await service.createFromTemplate('Balance Sheet', 'tenant-1', mockUser);

      expect(result).toBeDefined();
      expect(reportRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Balance Sheet',
          tenantId: 'tenant-1',
          createdBy: mockUser.id,
          isPublic: true,
        }),
      );
      expect(columnRepository.save).toHaveBeenCalled();
    });

    it('should throw error when template not found', async () => {
      await expect(
        service.createFromTemplate('Non Existent Template', 'tenant-1', mockUser),
      ).rejects.toThrow('Template "Non Existent Template" not found');
    });

    it('should create report with all template properties', async () => {
      const mockReport = {
        id: 'report-1',
        name: 'Sales by Month',
        type: ReportType.CHART,
        chartType: ChartType.LINE,
      } as Report;

      reportRepository.create.mockReturnValue(mockReport as any);
      reportRepository.save.mockResolvedValue(mockReport);
      columnRepository.create.mockReturnValue({} as any);
      columnRepository.save.mockResolvedValue({} as any);
      reportRepository.findOne.mockResolvedValue(mockReport);

      await service.createFromTemplate('Sales by Month', 'tenant-1', mockUser);

      expect(reportRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ReportType.CHART,
          chartType: ChartType.LINE,
        }),
      );
    });

    it('should create columns with correct properties', async () => {
      const mockReport = { id: 'report-1' } as Report;

      reportRepository.create.mockReturnValue(mockReport as any);
      reportRepository.save.mockResolvedValue(mockReport);
      columnRepository.create.mockImplementation((data) => data as any);
      columnRepository.save.mockResolvedValue({} as any);
      reportRepository.findOne.mockResolvedValue(mockReport);

      await service.createFromTemplate('Balance Sheet', 'tenant-1', mockUser);

      expect(columnRepository.create).toHaveBeenCalled();
      const createCalls = columnRepository.create.mock.calls;
      createCalls.forEach((call) => {
        expect(call[0]).toHaveProperty('reportId', 'report-1');
        expect(call[0]).toHaveProperty('tenantId', 'tenant-1');
      });
    });
  });
});
