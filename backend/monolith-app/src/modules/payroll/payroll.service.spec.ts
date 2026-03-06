import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PayrollService } from './payroll.service';
import { PayrollPeriod, PayrollPeriodStatus } from './entities/payroll-period.entity';
import { Payslip, PayslipStatus } from './entities/payslip.entity';
import { PieceRateWork, PieceRateStatus } from './entities/piece-rate-work.entity';
import { WorkOrder, WorkOrderStatus } from './entities/work-order.entity';
import { Employee } from '../hr/entities/employee.entity';
import { Attendance } from '../hr/entities/attendance.entity';
import { CacheService } from '../../common/cache/cache.service';

describe('PayrollService', () => {
  let service: PayrollService;

  const mockPeriodRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockPayslipRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockPieceRateRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockWorkOrderRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockEmployeeRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockAttendanceRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockCacheService = {
    getOrSet: jest.fn((key, factory) => factory()),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayrollService,
        {
          provide: getRepositoryToken(PayrollPeriod),
          useValue: mockPeriodRepository,
        },
        {
          provide: getRepositoryToken(Payslip),
          useValue: mockPayslipRepository,
        },
        {
          provide: getRepositoryToken(PieceRateWork),
          useValue: mockPieceRateRepository,
        },
        {
          provide: getRepositoryToken(WorkOrder),
          useValue: mockWorkOrderRepository,
        },
        {
          provide: getRepositoryToken(Employee),
          useValue: mockEmployeeRepository,
        },
        {
          provide: getRepositoryToken(Attendance),
          useValue: mockAttendanceRepository,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<PayrollService>(PayrollService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Payroll Period Management', () => {
    it('should create payroll period', async () => {
      const mockPeriod = {
        id: '1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        status: PayrollPeriodStatus.DRAFT,
      };
      mockPeriodRepository.create.mockReturnValue(mockPeriod);
      mockPeriodRepository.save.mockResolvedValue(mockPeriod);

      const result = await service.createPeriod('tenant-1', mockPeriod);

      expect(result).toEqual(mockPeriod);
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should find period by id', async () => {
      const mockPeriod = { id: '1', status: PayrollPeriodStatus.DRAFT };
      mockPeriodRepository.findOne.mockResolvedValue(mockPeriod);

      const result = await service.findPeriodById('tenant-1', '1');

      expect(result).toEqual(mockPeriod);
    });

    it('should find all periods', async () => {
      const mockPeriods = [
        { id: '1', status: PayrollPeriodStatus.DRAFT },
        { id: '2', status: PayrollPeriodStatus.PROCESSING },
      ];
      mockPeriodRepository.find.mockResolvedValue(mockPeriods);

      const result = await service.findAllPeriods('tenant-1');

      expect(result).toEqual(mockPeriods);
    });
  });

  describe('Piece Rate Work Management', () => {
    it('should create piece rate work', async () => {
      const mockWork = {
        id: '1',
        quantityCompleted: 100,
        ratePerUnit: 5,
        totalEarnings: 500,
      };
      mockPieceRateRepository.create.mockReturnValue(mockWork);
      mockPieceRateRepository.save.mockResolvedValue(mockWork);

      const result = await service.createPieceRateWork('tenant-1', {
        quantityCompleted: 100,
        ratePerUnit: 5,
      });

      expect(result.totalEarnings).toBe(500);
    });

    it('should approve piece rate work', async () => {
      const mockWork = {
        id: '1',
        status: PieceRateStatus.APPROVED,
      };
      mockPieceRateRepository.update.mockResolvedValue({ affected: 1 });
      mockPieceRateRepository.findOne.mockResolvedValue(mockWork);

      await service.approvePieceRateWork('tenant-1', '1', 'user-1');

      expect(mockPieceRateRepository.update).toHaveBeenCalled();
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should find piece rate work by id', async () => {
      const mockWork = { id: '1', status: PieceRateStatus.PENDING };
      mockPieceRateRepository.findOne.mockResolvedValue(mockWork);

      const result = await service.findPieceRateWorkById('tenant-1', '1');

      expect(result).toEqual(mockWork);
    });
  });

  describe('Work Order Management', () => {
    it('should create work order', async () => {
      const mockWorkOrder = {
        id: '1',
        status: WorkOrderStatus.DRAFT,
      };
      mockWorkOrderRepository.create.mockReturnValue(mockWorkOrder);
      mockWorkOrderRepository.save.mockResolvedValue(mockWorkOrder);

      const result = await service.createWorkOrder('tenant-1', mockWorkOrder);

      expect(result).toEqual(mockWorkOrder);
    });

    it('should update work order status', async () => {
      const mockWorkOrder = {
        id: '1',
        status: WorkOrderStatus.IN_PROGRESS,
      };
      mockWorkOrderRepository.update.mockResolvedValue({ affected: 1 });
      mockWorkOrderRepository.findOne.mockResolvedValue(mockWorkOrder);

      await service.updateWorkOrderStatus('tenant-1', '1', WorkOrderStatus.IN_PROGRESS);

      expect(mockWorkOrderRepository.update).toHaveBeenCalled();
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should find work order by id', async () => {
      const mockWorkOrder = { id: '1', status: WorkOrderStatus.DRAFT };
      mockWorkOrderRepository.findOne.mockResolvedValue(mockWorkOrder);

      const result = await service.findWorkOrderById('tenant-1', '1');

      expect(result).toEqual(mockWorkOrder);
    });
  });

  describe('Payslip Management', () => {
    it('should confirm payslip', async () => {
      const mockPayslip = {
        id: '1',
        status: PayslipStatus.CONFIRMED,
      };
      mockPayslipRepository.update.mockResolvedValue({ affected: 1 });
      mockPayslipRepository.findOne.mockResolvedValue(mockPayslip);

      await service.confirmPayslip('tenant-1', '1');

      expect(mockPayslipRepository.update).toHaveBeenCalled();
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should find payslip by id', async () => {
      const mockPayslip = { id: '1', status: PayslipStatus.DRAFT };
      mockPayslipRepository.findOne.mockResolvedValue(mockPayslip);

      const result = await service.findPayslipById('tenant-1', '1');

      expect(result).toEqual(mockPayslip);
    });

    it('should find payslips by period', async () => {
      const mockPayslips = [
        { id: '1', payrollPeriodId: 'period-1' },
        { id: '2', payrollPeriodId: 'period-1' },
      ];
      mockPayslipRepository.find.mockResolvedValue(mockPayslips);

      const result = await service.findPayslipsByPeriod('tenant-1', 'period-1');

      expect(result).toEqual(mockPayslips);
    });
  });
});
