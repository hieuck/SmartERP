import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportTemplateService, ReportCategory } from './report-template.service';
import { Report } from './entities/report.entity';
import { ReportColumn } from './entities/report-column.entity';
import { User } from '../../core/user/entities/user.entity';
import { createMockUser } from '@/common/test/test-helpers';

describe('ReportTemplateService', () => {
  let service: ReportTemplateService;
  let reportRepository: Repository<Report>;
  let columnRepository: Repository<ReportColumn>;

  const mockUser: User = {
    id: 'user-123',
    tenantId: 'tenant-123',
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportTemplateService,
        {
          provide: getRepositoryToken(Report),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ReportColumn),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReportTemplateService>(ReportTemplateService);
    reportRepository = module.get<Repository<Report>>(getRepositoryToken(Report));
    columnRepository = module.get<Repository<ReportColumn>>(getRepositoryToken(ReportColumn));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStandardTemplates', () => {
    it('should return 20 standard templates', () => {
      const templates = service.getStandardTemplates();
      expect(templates).toHaveLength(20);
    });

    it('should have templates for all categories', () => {
      const templates = service.getStandardTemplates();
      const categories = [...new Set(templates.map((t) => t.category))];
      
      expect(categories).toContain(ReportCategory.ACCOUNTING);
      expect(categories).toContain(ReportCategory.INVENTORY);
      expect(categories).toContain(ReportCategory.SALES);
      expect(categories).toContain(ReportCategory.PURCHASING);
      expect(categories).toContain(ReportCategory.HR);
      expect(categories).toContain(ReportCategory.MANUFACTURING);
    });

    it('should have 5 accounting reports', () => {
      const templates = service.getTemplatesByCategory(ReportCategory.ACCOUNTING);
      expect(templates).toHaveLength(5);
      expect(templates.map((t) => t.name)).toContain('Balance Sheet');
      expect(templates.map((t) => t.name)).toContain('Profit & Loss Statement');
    });

    it('should have 4 inventory reports', () => {
      const templates = service.getTemplatesByCategory(ReportCategory.INVENTORY);
      expect(templates).toHaveLength(4);
      expect(templates.map((t) => t.name)).toContain('Stock Summary');
    });

    it('should have 4 sales reports', () => {
      const templates = service.getTemplatesByCategory(ReportCategory.SALES);
      expect(templates).toHaveLength(4);
      expect(templates.map((t) => t.name)).toContain('Sales by Customer');
    });

    it('should have 3 purchasing reports', () => {
      const templates = service.getTemplatesByCategory(ReportCategory.PURCHASING);
      expect(templates).toHaveLength(3);
      expect(templates.map((t) => t.name)).toContain('Purchase by Supplier');
    });

    it('should have 2 HR reports', () => {
      const templates = service.getTemplatesByCategory(ReportCategory.HR);
      expect(templates).toHaveLength(2);
      expect(templates.map((t) => t.name)).toContain('Employee Attendance Summary');
    });

    it('should have 2 manufacturing reports', () => {
      const templates = service.getTemplatesByCategory(ReportCategory.MANUFACTURING);
      expect(templates).toHaveLength(2);
      expect(templates.map((t) => t.name)).toContain('Work Order Status');
    });
  });

  describe('getCategories', () => {
    it('should return all report categories', () => {
      const categories = service.getCategories();
      expect(categories).toHaveLength(7);
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
    it('should create report from template', async () => {
      const mockReport = {
        id: 'report-123',
        name: 'Balance Sheet',
        tenantId: 'tenant-123',
      } as Report;

      jest.spyOn(reportRepository, 'create').mockReturnValue(mockReport);
      jest.spyOn(reportRepository, 'save').mockResolvedValue(mockReport);
      jest.spyOn(columnRepository, 'create').mockImplementation((data) => data as any);
      jest.spyOn(columnRepository, 'save').mockResolvedValue([] as any);
      jest.spyOn(reportRepository, 'findOne').mockResolvedValue({
        ...mockReport,
        columns: [],
      } as any);

      const result = await service.createFromTemplate(
        'Balance Sheet',
        mockUser,
        mockUser,
      );

      expect(result).toBeDefined();
      expect(reportRepository.create).toHaveBeenCalled();
      expect(reportRepository.save).toHaveBeenCalled();
      expect(columnRepository.save).toHaveBeenCalled();
    });

    it('should throw error for invalid template name', async () => {
      await expect(
        service.createFromTemplate('Invalid Template', 'tenant-123', mockUser),
      ).rejects.toThrow('Template "Invalid Template" not found');
    });

    it('should create public report by default', async () => {
      const mockReport = {
        id: 'report-123',
        name: 'Balance Sheet',
        isPublic: true,
        tenantId: 'tenant-123',
      } as Report;

      jest.spyOn(reportRepository, 'create').mockReturnValue(mockReport);
      jest.spyOn(reportRepository, 'save').mockResolvedValue(mockReport);
      jest.spyOn(columnRepository, 'create').mockImplementation((data) => data as any);
      jest.spyOn(columnRepository, 'save').mockResolvedValue([] as any);
      jest.spyOn(reportRepository, 'findOne').mockResolvedValue({
        ...mockReport,
        columns: [],
      } as any);

      await service.createFromTemplate('Balance Sheet', mockUser, mockUser);

      const createCall = (reportRepository.create as jest.Mock).mock.calls[0][0];
      expect(createCall.isPublic).toBe(true);
    });
  });
});
