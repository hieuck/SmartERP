import { Test, TestingModule } from '@nestjs/testing';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';

describe('PayrollController', () => {
  let controller: PayrollController;
  let service: jest.Mocked<PayrollService>;

  const mockPayrollService = {
    findAllPeriods: jest.fn(),
    createPeriod: jest.fn(),
    createPieceRateWork: jest.fn(),
    findPieceRateWorksByEmployee: jest.fn(),
    approvePieceRateWork: jest.fn(),
    findAllWorkOrdeest.fn(),
    createPieceRateWork: jest.fn(),
    findPieceRateWorksByEmployee: jest.fn(),
    approvePieceRateWork: jest.fn(),
    findAllWorkOrders: jest.fn(),
    createWorkOrder: jest.fn(),
    updateWorkOrderStatus: jest.fn(),
    generatePayslips: jest.fn(),
    findPayslipsByPeriod: jest.fn(),
    confirmPayslip: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PayrollController],
      providers: [
        {
          provide: PayrollService,
          useValue: mockPayrollService,
        },
      ],
    }).compile();

    controller = module.get<PayrollController>(PayrollController);
    service = module.get(PayrollService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAllPeriods', () => {
    it('should return all payroll periods', async () => {
      const periods: PayrollPeriod[] = [
        { id: '1', name: 'January 2026', startDate: new Date(), endDate: new Date() } as PayrollPeriod,
        { id: '2', name: 'February 2026', startDate: new Date(), endDate: new Date() } as PayrollPeriod,
      ];

      service.findAllPeriods.mockResolvedValue(periods);

      expect(await controller.findAllPeriods('tenant-1')).toEqual(periods);
      expect(service.findAllPeriods).toHaveBeenCalledWith('tenant-1');
    });
  });

  describe('createPeriod', () => {
    it('should create payroll period', async () => {
      const data: Partial<PayrollPeriod> = {
        name: 'March 2026',
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-03-31'),
      };

      const created: PayrollPeriod = { id: '3', ...data } as PayrollPeriod;

      service.createPeriod.mockResolvedValue(created);

      expect(await controller.createPeriod('tenant-1', data)).toEqual(created);
      expect(service.createPeriod).toHaveBeenCalledWith('tenant-1', data);
    });
  });

  describe('createPieceRateWork', () => {
    it('should create piece rate work', async () => {
      const data: Partial<PieceRateWork> = {
        employeeId: 'emp-1',
        workDate: new Date(),
        quantity: 100,
        ratePerUnit: 5000,
      };

      const created: PieceRateWork = { id: '1', ...data } as PieceRateWork;

      service.createPieceRateWork.mockResolvedValue(created);

      expect(await controller.createPieceRateWork('tenant-1', data)).toEqual(created);
      expect(service.createPieceRateWork).toHaveBeenCalledWith('tenant-1', data);
    });
  });

  describe('findPieceRateWorksByEmployee', () => {
    it('should find piece rate works by employee', async () => {
      const works: PieceRateWork[] = [
        { id: '1', employeeId: 'emp-1', quantity: 100 } as PieceRateWork,
        { id: '2', employeeId: 'emp-1', quantity: 150 } as PieceRateWork,
      ];

      service.findPieceRateWorksByEmployee.mockResolvedValue(works);

      const result = await controller.findPieceRateWorksByEmployee(
        'tenant-1',
        'emp-1',
        '2026-03-01',
        '2026-03-31',
      );

      expect(result).toEqual(works);
      expect(service.findPieceRateWorksByEmployee).toHaveBeenCalledWith(
        'tenant-1',
        'emp-1',
        new Date('2026-03-01'),
        new Date('2026-03-31'),
      );
    });

    it('should find piece rate works without date range', async () => {
      const works: PieceRateWork[] = [
        { id: '1', employeeId: 'emp-1', quantity: 100 } as PieceRateWork,
      ];

      service.findPieceRateWorksByEmployee.mockResolvedValue(works);

      const result = await controller.findPieceRateWorksByEmployee('tenant-1', 'emp-1');

      expect(result).toEqual(works);
      expect(service.findPieceRateWorksByEmployee).toHaveBeenCalledWith(
        'tenant-1',
        'emp-1',
        undefined,
        undefined,
      );
    });
  });

  describe('approvePieceRateWork', () => {
    it('should approve piece rate work', async () => {
      const approved: PieceRateWork = {
        id: '1',
        employeeId: 'emp-1',
        approved: true,
        approvedBy: 'manager-1',
      } as PieceRateWork;

      service.approvePieceRateWork.mockResolvedValue(approved);

      expect(await controller.approvePieceRateWork('tenant-1', '1', 'manager-1')).toEqual(approved);
      expect(service.approvePieceRateWork).toHaveBeenCalledWith('tenant-1', '1', 'manager-1');
    });
  });

  describe('findAllWorkOrders', () => {
    it('should find all work orders', async () => {
      const orders: WorkOrder[] = [
        { id: '1', status: WorkOrderStatus.PENDING } as WorkOrder,
        { id: '2', status: WorkOrderStatus.IN_PROGRESS } as WorkOrder,
      ];

      service.findAllWorkOrders.mockResolvedValue(orders);

      expect(await controller.findAllWorkOrders('tenant-1')).toEqual(orders);
      expect(service.findAllWorkOrders).toHaveBeenCalledWith('tenant-1', undefined);
    });

    it('should find work orders by status', async () => {
      const orders: WorkOrder[] = [
        { id: '1', status: WorkOrderStatus.PENDING } as WorkOrder,
      ];

      service.findAllWorkOrders.mockResolvedValue(orders);

      expect(await controller.findAllWorkOrders('tenant-1', WorkOrderStatus.PENDING)).toEqual(orders);
      expect(service.findAllWorkOrders).toHaveBeenCalledWith('tenant-1', WorkOrderStatus.PENDING);
    });
  });

  describe('createWorkOrder', () => {
    it('should create work order', async () => {
      const data: Partial<WorkOrder> = {
        productId: 'prod-1',
        quantity: 1000,
        dueDate: new Date(),
      };

      const created: WorkOrder = { id: '1', ...data } as WorkOrder;

      service.createWorkOrder.mockResolvedValue(created);

      expect(await controller.createWorkOrder('tenant-1', data)).toEqual(created);
      expect(service.createWorkOrder).toHaveBeenCalledWith('tenant-1', data);
    });
  });

  describe('updateWorkOrderStatus', () => {
    it('should update work order status', async () => {
      const updated: WorkOrder = {
        id: '1',
        status: WorkOrderStatus.COMPLETED,
      } as WorkOrder;

      service.updateWorkOrderStatus.mockResolvedValue(updated);

      expect(await controller.updateWorkOrderStatus('tenant-1', '1', WorkOrderStatus.COMPLETED)).toEqual(updated);
      expect(service.updateWorkOrderStatus).toHaveBeenCalledWith('tenant-1', '1', WorkOrderStatus.COMPLETED);
    });
  });

  describe('generatePayslips', () => {
    it('should generate payslips for period', async () => {
      const payslips: Payslip[] = [
        { id: '1', employeeId: 'emp-1', grossPay: 10000000 } as Payslip,
        { id: '2', employeeId: 'emp-2', grossPay: 12000000 } as Payslip,
      ];

      service.generatePayslips.mockResolvedValue(payslips);

      expect(await controller.generatePayslips('tenant-1', 'period-1')).toEqual(payslips);
      expect(service.generatePayslips).toHaveBeenCalledWith('tenant-1', 'period-1');
    });
  });

  describe('findPayslipsByPeriod', () => {
    it('should find payslips by period', async () => {
      const payslips: Payslip[] = [
        { id: '1', employeeId: 'emp-1', grossPay: 10000000 } as Payslip,
      ];

      service.findPayslipsByPeriod.mockResolvedValue(payslips);

      expect(await controller.findPayslipsByPeriod('tenant-1', 'period-1')).toEqual(payslips);
      expect(service.findPayslipsByPeriod).toHaveBeenCalledWith('tenant-1', 'period-1');
    });
  });

  describe('confirmPayslip', () => {
    it('should confirm payslip', async () => {
      const confirmed: Payslip = {
        id: '1',
        employeeId: 'emp-1',
        confirmed: true,
      } as Payslip;

      service.confirmPayslip.mockResolvedValue(confirmed);

      expect(await controller.confirmPayslip('tenant-1', '1')).toEqual(confirmed);
      expect(service.confirmPayslip).toHaveBeenCalledWith('tenant-1', '1');
    });
  });
});
