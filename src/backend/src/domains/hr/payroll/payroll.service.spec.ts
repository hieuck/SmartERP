import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayrollService } from './payroll.service';
;
;
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PayrollService', () => {
  let service: PayrollService;
  let salaryStructureRepo: Repository<SalaryStructure>;
  let payslipRepo: Repository<Payslip>;

  const mockSalaryStructureRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockPayslipRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayrollService,
        {
          provide: getRepositoryToken(SalaryStructure),
          useValue: mockSalaryStructureRepo,
        },
        {
          provide: getRepositoryToken(Payslip),
          useValue: mockPayslipRepo,
        },
      ],
    }).compile();

    service = module.get<PayrollService>(PayrollService);
    salaryStructureRepo = module.get<Repository<SalaryStructure>>(
      getRepositoryToken(SalaryStructure),
    );
    payslipRepo = module.get<Repository<Payslip>>(getRepositoryToken(Payslip));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSalaryStructure', () => {
    it('should create salary structure for employee', async () => {
      const dto = {
        employeeId: 'emp1',
        baseSalary: 10000000,
        allowances: 2000000,
        deductions: 500000,
        effectiveFrom: new Date('2026-01-01'),
      };

      const mockStructure = { id: 'struct1', ...dto, tenantId: 'tenant1' };
      mockSalaryStructureRepo.create.mockReturnValue(mockStructure);
      mockSalaryStructureRepo.save.mockResolvedValue(mockStructure);

      const result = await service.createSalaryStructure(dto, 'tenant1');

      expect(result).toEqual(mockStructure);
      expect(mockSalaryStructureRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant1' }),
      );
    });
  });

  describe('generatePayslip', () => {
    it('should generate payslip from salary structure', async () => {
      const mockStructure = {
        id: 'struct1',
        employeeId: 'emp1',
        baseSalary: 10000000,
        allowances: 2000000,
        deductions: 500000,
        tenantId: 'tenant1',
      };

      const mockPayslip = {
        id: 'payslip1',
        employeeId: 'emp1',
        salaryStructureId: 'struct1',
        month: 3,
        year: 2026,
        baseSalary: 10000000,
        allowances: 2000000,
        deductions: 500000,
        grossSalary: 12000000,
        taxAmount: 900000,
        netSalary: 10600000,
        status: PayslipStatus.DRAFT,
        tenantId: 'tenant1',
      };

      mockSalaryStructureRepo.findOne.mockResolvedValue(mockStructure);
      mockPayslipRepo.findOne.mockResolvedValue(null);
      mockPayslipRepo.create.mockReturnValue(mockPayslip);
      mockPayslipRepo.save.mockResolvedValue(mockPayslip);

      const result = await service.generatePayslip('struct1', 3, 2026, 'tenant1');

      expect(result.grossSalary).toBe(12000000);
      expect(result.status).toBe(PayslipStatus.DRAFT);
      expect(mockPayslipRepo.save).toHaveBeenCalled();
    });

    it('should throw error if salary structure not found', async () => {
      mockSalaryStructureRepo.findOne.mockResolvedValue(null);

      await expect(
        service.generatePayslip('struct1', 3, 2026, 'tenant1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error if payslip already exists', async () => {
      const mockStructure = { id: 'struct1', tenantId: 'tenant1' };
      const existingPayslip = { id: 'payslip1' };

      mockSalaryStructureRepo.findOne.mockResolvedValue(mockStructure);
      mockPayslipRepo.findOne.mockResolvedValue(existingPayslip);

      await expect(
        service.generatePayslip('struct1', 3, 2026, 'tenant1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('submitPayslip', () => {
    it('should submit draft payslip', async () => {
      const mockPayslip = {
        id: 'payslip1',
        status: PayslipStatus.DRAFT,
        tenantId: 'tenant1',
      };

      mockPayslipRepo.findOne.mockResolvedValue(mockPayslip);
      mockPayslipRepo.save.mockResolvedValue({
        ...mockPayslip,
        status: PayslipStatus.SUBMITTED,
      });

      const result = await service.submitPayslip('payslip1', 'tenant1');

      expect(result.status).toBe(PayslipStatus.SUBMITTED);
    });

    it('should throw error if payslip not in draft status', async () => {
      const mockPayslip = {
        id: 'payslip1',
        status: PayslipStatus.PAID,
        tenantId: 'tenant1',
      };

      mockPayslipRepo.findOne.mockResolvedValue(mockPayslip);

      await expect(service.submitPayslip('payslip1', 'tenant1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('markAsPaid', () => {
    it('should mark submitted payslip as paid', async () => {
      const mockPayslip = {
        id: 'payslip1',
        status: PayslipStatus.SUBMITTED,
        tenantId: 'tenant1',
      };

      const paymentDate = new Date('2026-03-31');

      mockPayslipRepo.findOne.mockResolvedValue(mockPayslip);
      mockPayslipRepo.save.mockResolvedValue({
        ...mockPayslip,
        status: PayslipStatus.PAID,
        paymentDate,
      });

      const result = await service.markAsPaid('payslip1', paymentDate, 'tenant1');

      expect(result.status).toBe(PayslipStatus.PAID);
      expect(result.paymentDate).toBe(paymentDate);
    });

    it('should throw error if payslip not in submitted status', async () => {
      const mockPayslip = {
        id: 'payslip1',
        status: PayslipStatus.DRAFT,
        tenantId: 'tenant1',
      };

      mockPayslipRepo.findOne.mockResolvedValue(mockPayslip);

      await expect(
        service.markAsPaid('payslip1', new Date(), 'tenant1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPayslipsByEmployee', () => {
    it('should return payslips for employee', async () => {
      const mockPayslips = [
        { id: 'payslip1', employeeId: 'emp1', month: 1, year: 2026 },
        { id: 'payslip2', employeeId: 'emp1', month: 2, year: 2026 },
      ];

      mockPayslipRepo.find.mockResolvedValue(mockPayslips);

      const result = await service.getPayslipsByEmployee('emp1', 'tenant1');

      expect(result).toHaveLength(2);
      expect(mockPayslipRepo.find).toHaveBeenCalledWith({
        where: { employeeId: 'emp1', tenantId: 'tenant1' },
        order: { year: 'DESC', month: 'DESC' },
      });
    });
  });

  describe('getPayslipsByMonth', () => {
    it('should return all payslips for a specific month', async () => {
      const mockPayslips = [
        { id: 'payslip1', month: 3, year: 2026 },
        { id: 'payslip2', month: 3, year: 2026 },
      ];

      mockPayslipRepo.find.mockResolvedValue(mockPayslips);

      const result = await service.getPayslipsByMonth(3, 2026, 'tenant1');

      expect(result).toHaveLength(2);
      expect(mockPayslipRepo.find).toHaveBeenCalledWith({
        where: { month: 3, year: 2026, tenantId: 'tenant1' },
        relations: ['employee'],
      });
    });
  });
});
