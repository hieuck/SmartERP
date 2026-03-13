import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ReportService } from './report.service';
import { Report, ReportType, ChartType } from '../enums/platform.enum';
import { ReportColumn, ColumnType, AggregationType } from '../enums/platform.enum';
import { ReportExecution, ExecutionStatus } from '../enums/platform.enum';
import { User } from '../user/entities/user.entity';
import { createMockUser } from '@/common/test/test-helpers';

describe('ReportService', () => {
  let service: ReportService;
  let reportRepository: Repository<Report>;
  let columnRepository: Repository<ReportColumn>;
  let executionRepository: Repository<ReportExecution>;
  let dataSource: DataSource;

  const mockUser: User = {
    id: 'user-123',
    tenantId: 'tenant-123'
  } as User;

  const mockReport: Report = {
    id: 'report-123',
    reference: 'RPT-2026-0001',
    name: 'Sales Report',
    description: 'Monthly sales report',
    type: ReportType.TABLE,
    sourceEntity: 'Order',
    tenantId: 'tenant-123',
    createdBy: 'user-123',
    isActive: true,
    isPublic: false,
    columns: [],
    createdAt: new Date(),
    updatedAt: new Date()
  } as Report;

  const mockColumn: ReportColumn = {
    id: 'column-123',
    reportId: 'report-123',
    fieldName: 'totalAmount',
    label: 'Total Amount',
    type: ColumnType.CURRENCY,
    aggregation: AggregationType.SUM,
    sequence: 1,
    isVisible: true,
    isSortable: true,
    tenantId: 'tenant-123'
  } as ReportColumn;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        {
          provide: getRepositoryToken(Report),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            remove: jest.fn()
  }
  },
        {
          provide: getRepositoryToken(ReportColumn),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn()
  }
  },
        {
          provide: getRepositoryToken(ReportExecution),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn()
  }
  },
        {
          provide: DataSource,
          useValue: {
            getMetadata: jest.fn(),
            getRepository: jest.fn()
  }
  },
      ]
  }).compile();

    service = module.get<ReportService>(ReportService);
    reportRepository = module.get<Repository<Report>>(getRepositoryToken(Report));
    columnRepository = module.get<Repository<ReportColumn>>(getRepositoryToken(ReportColumn));
    executionRepository = module.get<Repository<ReportExecution>>(getRepositoryToken(ReportExecution));
    dataSource = module.get<DataSource>(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new report', async () => {
      const createData = {
        name: 'Sales Report',
        sourceEntity: 'Order',
        type: ReportType.TABLE
  };

      jest.spyOn(reportRepository, 'create').mockReturnValue(mockReport);
      jest.spyOn(reportRepository, 'save').mockResolvedValue(mockReport);

      const result = await service.create(mockUser, createData, mockUser);

      expect(result).toEqual(mockReport);
      expect(reportRepository.create).toHaveBeenCalledWith({
        ...createData,
        tenantId: 'tenant-123',
        createdBy: 'user-123'
  });
      expect(reportRepository.save).toHaveBeenCalledWith(mockReport);
    });
  });

  describe('findOne', () => {
    it('should return a report by ID', async () => {
      jest.spyOn(reportRepository, 'findOne').mockResolvedValue(mockReport);

      const result = await service.findOne(mockUser, 'report-123');

      expect(result).toEqual(mockReport);
      expect(reportRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'report-123', tenantId: 'tenant-123' },
        relations: ['columns', 'creator']
  });
    });

    it('should throw NotFoundException if report not found', async () => {
      jest.spyOn(reportRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(mockUser, 'invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all reports for tenant', async () => {
      const reports = [mockReport];
      jest.spyOn(reportRepository, 'find').mockResolvedValue(reports);

      const result = await service.findAll(mockUser);

      expect(result).toEqual(reports);
      expect(reportRepository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-123' },
        relations: ['columns', 'creator'],
        order: { createdAt: 'DESC' }
  });
    });
  });

  describe('findPublic', () => {
    it('should return only public active reports', async () => {
      const publicReport = { ...mockReport, isPublic: true };
      jest.spyOn(reportRepository, 'find').mockResolvedValue([publicReport]);

      const result = await service.findPublic(mockUser);

      expect(result).toEqual([publicReport]);
      expect(reportRepository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-123', isPublic: true, isActive: true },
        relations: ['columns'],
        order: { name: 'ASC' }
  });
    });
  });

  describe('update', () => {
    it('should update a report', async () => {
      const updateData = { name: 'Updated Report' };
      const updatedReport = { ...mockReport, ...updateData };

      jest.spyOn(reportRepository, 'findOne').mockResolvedValue(mockReport);
      jest.spyOn(reportRepository, 'save').mockResolvedValue(updatedReport);

      const result = await service.update('report-123', updateData, mockUser, mockUser);

      expect(result.name).toBe('Updated Report');
      expect(reportRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a report', async () => {
      jest.spyOn(reportRepository, 'findOne').mockResolvedValue(mockReport);
      jest.spyOn(reportRepository, 'remove').mockResolvedValue(mockReport);

      await service.remove(mockUser, 'report-123', mockUser);

      expect(reportRepository.remove).toHaveBeenCalledWith(mockReport);
    });
  });

  describe('addColumn', () => {
    it('should add a column to report', async () => {
      const columnData = {
        fieldName: 'totalAmount',
        label: 'Total Amount',
        type: ColumnType.CURRENCY
  };

      jest.spyOn(reportRepository, 'findOne').mockResolvedValue(mockReport);
      jest.spyOn(columnRepository, 'create').mockReturnValue(mockColumn);
      jest.spyOn(columnRepository, 'save').mockResolvedValue(mockColumn);

      const result = await service.addColumn('report-123', columnData, mockUser, mockUser);

      expect(result).toEqual(mockColumn);
      expect(columnRepository.create).toHaveBeenCalledWith({
        ...columnData,
        reportId: 'report-123',
        tenantId: 'tenant-123'
  });
    });
  });

  describe('removeColumn', () => {
    it('should remove a column from report', async () => {
      jest.spyOn(reportRepository, 'findOne').mockResolvedValue(mockReport);
      jest.spyOn(columnRepository, 'findOne').mockResolvedValue(mockColumn);
      jest.spyOn(columnRepository, 'remove').mockResolvedValue(mockColumn);

      await service.removeColumn('report-123', 'column-123', mockUser, mockUser);

      expect(columnRepository.remove).toHaveBeenCalledWith(mockColumn);
    });

    it('should throw NotFoundException if column not found', async () => {
      jest.spyOn(reportRepository, 'findOne').mockResolvedValue(mockReport);
      jest.spyOn(columnRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.removeColumn('report-123', 'invalid-id', 'tenant-123', mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('execute', () => {
    it('should execute report and return results', async () => {
      const mockExecution = {
        id: 'execution-123',
        reportId: 'report-123',
        status: ExecutionStatus.COMPLETED,
        result: [{ totalAmount: 1000 }],
        rowCount: 1,
        executionTime: 100,
        tenantId: 'tenant-123',
        executedBy: 'user-123'
      } as ReportExecution;

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([])
      };

      const mockEntityMetadata = {
        columns: [{ propertyName: 'totalAmount' }, { propertyName: 'tenantId' }]
      };

      jest.spyOn(reportRepository, 'findOne').mockResolvedValue({
        ...mockReport,
        columns: [mockColumn]
      });
      jest.spyOn(executionRepository, 'create').mockReturnValue(mockExecution);
      jest.spyOn(executionRepository, 'save').mockResolvedValue(mockExecution);
      jest.spyOn(dataSource, 'getMetadata').mockReturnValue(mockEntityMetadata as any);
      jest.spyOn(dataSource, 'getRepository').mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder)
      } as any);

      const result = await service.execute('report-123', {}, mockUser, mockUser);

      expect(result.status).toBe(ExecutionStatus.COMPLETED);
      expect(result.rowCount).toBe(1);
      expect(executionRepository.save).toHaveBeenCalled();
    });

    it('should handle execution errors', async () => {
      const mockExecution = {
        id: 'execution-123',
        reportId: 'report-123',
        status: ExecutionStatus.RUNNING,
        tenantId: 'tenant-123',
        executedBy: 'user-123'
  } as ReportExecution;

      jest.spyOn(reportRepository, 'findOne').mockResolvedValue(mockReport);
      jest.spyOn(executionRepository, 'create').mockReturnValue(mockExecution);
      jest.spyOn(executionRepository, 'save').mockResolvedValue(mockExecution);
      jest.spyOn(dataSource, 'getMetadata').mockImplementation(() => {
        throw new Error('Invalid entity');
      });

      await expect(
        service.execute('report-123', {}, 'tenant-123', mockUser),
      ).rejects.toThrow();

      expect(mockExecution.status).toBe(ExecutionStatus.FAILED);
    });
  });

  describe('getExecutionHistory', () => {
    it('should return execution history for report', async () => {
      const executions = [
        { id: 'exec-1', reportId: 'report-123' } as ReportExecution,
      ];

      jest.spyOn(reportRepository, 'findOne').mockResolvedValue(mockReport);
      jest.spyOn(executionRepository, 'find').mockResolvedValue(executions);

      const result = await service.getExecutionHistory('report-123', mockUser, 10);

      expect(result).toEqual(executions);
      expect(executionRepository.find).toHaveBeenCalledWith({
        where: { reportId: 'report-123', tenantId: 'tenant-123' },
        relations: ['executor'],
        order: { executedAt: 'DESC' },
        take: 10
  });
    });
  });

  describe('getExecution', () => {
    it('should return execution by ID', async () => {
      const mockExecution = {
        id: 'execution-123',
        reportId: 'report-123',
        tenantId: 'tenant-123'
  } as ReportExecution;

      jest.spyOn(executionRepository, 'findOne').mockResolvedValue(mockExecution);

      const result = await service.getExecution('execution-123', mockUser);

      expect(result).toEqual(mockExecution);
    });

    it('should throw NotFoundException if execution not found', async () => {
      jest.spyOn(executionRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getExecution('invalid-id', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
