import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ReportService } from './report.service';
import { Report } from './entities/report.entity';
import { ReportColumn } from './entities/report-column.entity';
import { ReportExecution } from './entities/report-execution.entity';
import { ReportType } from './enums/report-type.enum';
import { ExecutionStatus } from './enums/execution-status.enum';
import { User } from '@/common/security/permission.service';

describe('ReportService', () => {
  let service: ReportService;
  let reportRepository: jest.Mocked<Repository<Report>>;
  let columnRepository: jest.Mocked<Repository<ReportColumn>>;
  let executionRepository: jest.Mocked<Repository<ReportExecution>>;
  let dataSource: jest.Mocked<DataSource>;

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    roles: ['admin'],
  };

  const mockReport: Report = {
    id: 'report-1',
    tenantId: 'tenant-1',
    name: 'Test Report',
    type: ReportType.TABLE,
    sourceEntity: 'Product',
    isPublic: true,
    isActive: true,
    createdBy: 'user-1',
    columns: [],
    createdAt: new Date(),
    generateReference: jest.fn(),
    validate: jest.fn(),
  } as any;

  const mockColumn: ReportColumn = {
    id: 'column-1',
    reportId: 'report-1',
    tenantId: 'tenant-1',
    fieldName: 'name',
    label: 'Name',
    isVisible: true,
    sequence: 1,
    validate: jest.fn(),
  } as any;

  const mockExecution: ReportExecution = {
    id: 'execution-1',
    reportId: 'report-1',
    tenantId: 'tenant-1',
    status: ExecutionStatus.COMPLETED,
    executedBy: 'user-1',
    executedAt: new Date(),
  } as ReportExecution;

  beforeEach(async () => {
    const mockReportRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
    };

    const mockColumnRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const mockExecutionRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const mockDataSource = {
      getMetadata: jest.fn(),
      getRepository: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        {
          provide: getRepositoryToken(Report),
          useValue: mockReportRepository,
        },
        {
          provide: getRepositoryToken(ReportColumn),
          useValue: mockColumnRepository,
        },
        {
          provide: getRepositoryToken(ReportExecution),
          useValue: mockExecutionRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
    reportRepository = module.get(getRepositoryToken(Report));
    columnRepository = module.get(getRepositoryToken(ReportColumn));
    executionRepository = module.get(getRepositoryToken(ReportExecution));
    dataSource = module.get(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create report successfully', async () => {
      reportRepository.create.mockReturnValue(mockReport as any);
      reportRepository.save.mockResolvedValue(mockReport);

      const data = { name: 'Test Report', type: ReportType.TABLE };
      const result = await service.create(data, 'tenant-1', mockUser);

      expect(result).toEqual(mockReport);
      expect(reportRepository.create).toHaveBeenCalledWith({
        ...data,
        tenantId: 'tenant-1',
        createdBy: mockUser.id,
      });
    });
  });

  describe('findOne', () => {
    it('should return report with relations', async () => {
      reportRepository.findOne.mockResolvedValue(mockReport);

      const result = await service.findOne('report-1', 'tenant-1');

      expect(result).toEqual(mockReport);
      expect(reportRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'report-1', tenantId: 'tenant-1' },
        relations: ['columns', 'creator'],
      });
    });

    it('should throw NotFoundException when report not found', async () => {
      reportRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent', 'tenant-1')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('non-existent', 'tenant-1')).rejects.toThrow(
        'Report with ID non-existent not found',
      );
    });
  });

  describe('findAll', () => {
    it('should return all reports for tenant', async () => {
      reportRepository.find.mockResolvedValue([mockReport]);

      const result = await service.findAll('tenant-1');

      expect(result).toEqual([mockReport]);
      expect(reportRepository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        relations: ['columns', 'creator'],
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when no reports found', async () => {
      reportRepository.find.mockResolvedValue([]);

      const result = await service.findAll('tenant-1');

      expect(result).toEqual([]);
    });
  });

  describe('findPublic', () => {
    it('should return only public active reports', async () => {
      reportRepository.find.mockResolvedValue([mockReport]);

      const result = await service.findPublic('tenant-1');

      expect(result).toEqual([mockReport]);
      expect(reportRepository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', isPublic: true, isActive: true },
        relations: ['columns'],
        order: { name: 'ASC' },
      });
    });
  });

  describe('update', () => {
    it('should update report successfully', async () => {
      const updatedReport = {
        ...mockReport,
        name: 'Updated Report',
        generateReference: jest.fn(),
        validate: jest.fn(),
      };
      reportRepository.findOne.mockResolvedValue(mockReport);
      reportRepository.save.mockResolvedValue(updatedReport as any);

      const result = await service.update(
        'report-1',
        { name: 'Updated Report' },
        'tenant-1',
        mockUser,
      );

      expect(result.name).toBe('Updated Report');
      expect(reportRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when report not found', async () => {
      reportRepository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent', {}, 'tenant-1', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove report successfully', async () => {
      reportRepository.findOne.mockResolvedValue(mockReport);
      reportRepository.remove.mockResolvedValue(mockReport);

      await service.remove('report-1', 'tenant-1', mockUser);

      expect(reportRepository.remove).toHaveBeenCalledWith(mockReport);
    });

    it('should throw NotFoundException when report not found', async () => {
      reportRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent', 'tenant-1', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addColumn', () => {
    it('should add column to report', async () => {
      reportRepository.findOne.mockResolvedValue(mockReport);
      columnRepository.create.mockReturnValue(mockColumn as any);
      columnRepository.save.mockResolvedValue(mockColumn);

      const columnData = { fieldName: 'name', label: 'Name' };
      const result = await service.addColumn('report-1', columnData, 'tenant-1', mockUser);

      expect(result).toEqual(mockColumn);
      expect(columnRepository.create).toHaveBeenCalledWith({
        ...columnData,
        reportId: 'report-1',
        tenantId: 'tenant-1',
      });
    });

    it('should throw NotFoundException when report not found', async () => {
      reportRepository.findOne.mockResolvedValue(null);

      await expect(service.addColumn('non-existent', {}, 'tenant-1', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeColumn', () => {
    it('should remove column from report', async () => {
      reportRepository.findOne.mockResolvedValue(mockReport);
      columnRepository.findOne.mockResolvedValue(mockColumn);
      columnRepository.remove.mockResolvedValue(mockColumn);

      await service.removeColumn('report-1', 'column-1', 'tenant-1', mockUser);

      expect(columnRepository.remove).toHaveBeenCalledWith(mockColumn);
    });

    it('should throw NotFoundException when column not found', async () => {
      reportRepository.findOne.mockResolvedValue(mockReport);
      columnRepository.findOne.mockResolvedValue(null);

      await expect(
        service.removeColumn('report-1', 'non-existent', 'tenant-1', mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('execute', () => {
    it('should execute report successfully', async () => {
      const mockMetadata = {
        columns: [{ propertyName: 'name' }, { propertyName: 'price' }],
      };
      const mockQueryBuilder = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ name: 'Product 1', price: 100 }]),
      };

      reportRepository.findOne.mockResolvedValue({
        ...mockReport,
        columns: [{ ...mockColumn, isVisible: true, validate: jest.fn() }],
      } as any);
      executionRepository.create.mockReturnValue(mockExecution as any);
      executionRepository.save.mockResolvedValue({
        ...mockExecution,
        status: ExecutionStatus.COMPLETED,
        result: [{ name: 'Product 1', price: 100 }],
      });
      dataSource.getMetadata.mockReturnValue(mockMetadata as any);
      dataSource.getRepository.mockReturnValue(mockQueryBuilder as any);

      const result = await service.execute('report-1', {}, 'tenant-1', mockUser);

      expect(result.status).toBe(ExecutionStatus.COMPLETED);
      expect(executionRepository.save).toHaveBeenCalled();
    });

    it('should handle execution failure', async () => {
      reportRepository.findOne.mockResolvedValue(mockReport);
      executionRepository.create.mockReturnValue(mockExecution as any);
      executionRepository.save.mockResolvedValue(mockExecution);
      dataSource.getMetadata.mockImplementation(() => {
        throw new Error('Invalid entity');
      });

      await expect(service.execute('report-1', {}, 'tenant-1', mockUser)).rejects.toThrow();
      expect(executionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ExecutionStatus.FAILED,
        }),
      );
    });

    it('should validate invalid source entity', async () => {
      reportRepository.findOne.mockResolvedValue(mockReport);
      executionRepository.create.mockReturnValue(mockExecution as any);
      executionRepository.save.mockResolvedValue(mockExecution);
      dataSource.getMetadata.mockImplementation(() => {
        throw new Error('Entity not found');
      });

      await expect(service.execute('report-1', {}, 'tenant-1', mockUser)).rejects.toThrow();
    });

    it('should validate field names in filters', async () => {
      const reportWithFilters = {
        ...mockReport,
        filters: [{ field: 'invalidField', operator: '=', value: 'test' }],
        generateReference: jest.fn(),
        validate: jest.fn(),
      };
      const mockMetadata = {
        columns: [{ propertyName: 'name' }],
      };
      const mockQueryBuilder = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      reportRepository.findOne.mockResolvedValue(reportWithFilters as any);
      executionRepository.create.mockReturnValue(mockExecution as any);
      executionRepository.save.mockResolvedValue(mockExecution);
      dataSource.getMetadata.mockReturnValue(mockMetadata as any);
      dataSource.getRepository.mockReturnValue(mockQueryBuilder as any);

      await expect(service.execute('report-1', {}, 'tenant-1', mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should validate operators in filters', async () => {
      const reportWithInvalidOperator = {
        ...mockReport,
        filters: [{ field: 'name', operator: 'DROP TABLE', value: 'test' }],
        generateReference: jest.fn(),
        validate: jest.fn(),
      };
      const mockMetadata = {
        columns: [{ propertyName: 'name' }],
      };
      const mockQueryBuilder = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      reportRepository.findOne.mockResolvedValue(reportWithInvalidOperator as any);
      executionRepository.create.mockReturnValue(mockExecution as any);
      executionRepository.save.mockResolvedValue(mockExecution);
      dataSource.getMetadata.mockReturnValue(mockMetadata as any);
      dataSource.getRepository.mockReturnValue(mockQueryBuilder as any);

      await expect(service.execute('report-1', {}, 'tenant-1', mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getExecutionHistory', () => {
    it('should return execution history for report', async () => {
      reportRepository.findOne.mockResolvedValue(mockReport);
      executionRepository.find.mockResolvedValue([mockExecution]);

      const result = await service.getExecutionHistory('report-1', 'tenant-1', 10);

      expect(result).toEqual([mockExecution]);
      expect(executionRepository.find).toHaveBeenCalledWith({
        where: { reportId: 'report-1', tenantId: 'tenant-1' },
        relations: ['executor'],
        order: { executedAt: 'DESC' },
        take: 10,
      });
    });

    it('should use default limit when not provided', async () => {
      reportRepository.findOne.mockResolvedValue(mockReport);
      executionRepository.find.mockResolvedValue([]);

      await service.getExecutionHistory('report-1', 'tenant-1');

      expect(executionRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        }),
      );
    });

    it('should throw NotFoundException when report not found', async () => {
      reportRepository.findOne.mockResolvedValue(null);

      await expect(service.getExecutionHistory('non-existent', 'tenant-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getExecution', () => {
    it('should return execution by id', async () => {
      executionRepository.findOne.mockResolvedValue(mockExecution);

      const result = await service.getExecution('execution-1', 'tenant-1');

      expect(result).toEqual(mockExecution);
      expect(executionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'execution-1', tenantId: 'tenant-1' },
        relations: ['report', 'executor'],
      });
    });

    it('should throw NotFoundException when execution not found', async () => {
      executionRepository.findOne.mockResolvedValue(null);

      await expect(service.getExecution('non-existent', 'tenant-1')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getExecution('non-existent', 'tenant-1')).rejects.toThrow(
        'Execution with ID non-existent not found',
      );
    });
  });
});
