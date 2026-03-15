import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PayrollService } from './payroll.service';
import { SalaryStructure } from './entities/salary-structure.entity';
import { Payslip } from './entities/payslip.entity';
import { PayslipStatus } from './enums/payslip-status.enum';
import { CreateSalaryStructureDto } from './dto/create-salary-structure.dto';

describe('PayrollService', () => {
  let service: PayrollService;
  let salaryStructureRepository: jest.Mocked<Repository<SalaryStructure>>;
  let payslipRepository: jest.Mocked<Repository<Payslip>>;

  const mockSalaryStructure: SalaryStructure = {
    id: 'salary-1',
    employeeId: 'emp-1',
    baseSalary: 5000,
    allowances: { housing: 1000, transport: 500 },
    deductions: { tax: 500, insurance: 200 },
    effectiveFrom: new Date('2024-01-01'),
    tenantId: 'tenant-1',
  } as SalaryStructure;

  const mockPayslip: Payslip = {
    id: 'payslip-1',
    employeeId: 'emp-1',
    salaryStructureId: 'salary-1',
    month: 1,
    year: 2024,
    baseSalary: 5000,
    allowances: { housing: 1000, transport: 500 },
    deductions: { tax: 500, insurance: 200 },
    status: PayslipStatus.DRAFT,
    tenantId: 'tenant-1',
  } as Payslip;

  beforeEach(async () => {
    const mockSalaryRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const mockPayslipRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayrollService,
        {
          provide: getRepositoryToken(SalaryStructure),
          useValue: mockSalaryRepo,
        },
        {
          provide: getRepositoryToken(Payslip),
          useValue: mockPayslipRepo,
        },
      ],
    }).compile();

    service = module.get<PayrollService>(PayrollService);
    salaryStructureRepository = module.get(getRepositoryToken(SalaryStructure));
    payslipRepository = module.get(getRepositoryToken(Payslip));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSalaryStructure', () => {
    const createDto: CreateSalaryStructureDto = {
      employeeId: 'emp-1',
      baseSalary: 5000,
      allowances: { housing: 1000, transport: 500 },
      deductions: { tax: 500, insurance: 200 },
      effectiveFrom: new Date('2024-01-01'),
    };

    it('should create salary structure successfully', async () => {
      salaryStructureRepository.create.mockReturnValue(mockSalaryStructure as any);
      salaryStructureRepository.save.mockResolvedValue(mockSalaryStructure);

      const result = await service.createSalaryStructure(createDto, 'tenant-1');

      expect(salaryStructureRepository.create).toHaveBeenCalledWith({
        ...createDto,
        tenantId: 'tenant-1',
      });
      expect(salaryStructureRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockSalaryStructure);
    });

    it('should handle zero base salary', async () => {
      const zeroSalaryDto = { ...createDto, baseSalary: 0 };
      salaryStructureRepository.create.mockReturnValue(mockSalaryStructure as any);
      salaryStructureRepository.save.mockResolvedValue(mockSalaryStructure);

      const result = await service.createSalaryStructure(zeroSalaryDto, 'tenant-1');

      expect(result).toBeDefined();
    });

    it('should handle empty allowances', async () => {
      const noAllowancesDto = { ...createDto, allowances: {} };
      salaryStructureRepository.create.mockReturnValue(mockSalaryStructure as any);
      salaryStructureRepository.save.mockResolvedValue(mockSalaryStructure);

      const result = await service.createSalaryStructure(noAllowancesDto, 'tenant-1');

      expect(result).toBeDefined();
    });

    it('should handle empty deductions', async () => {
      const noDeductionsDto = { ...createDto, deductions: {} };
      salaryStructureRepository.create.mockReturnValue(mockSalaryStructure as any);
      salaryStructureRepository.save.mockResolvedValue(mockSalaryStructure);

      const result = await service.createSalaryStructure(noDeductionsDto, 'tenant-1');

      expect(result).toBeDefined();
    });

    it('should handle null allowances', async () => {
      const nullAllowancesDto = { ...createDto, allowances: null as any };
      salaryStructureRepository.create.mockReturnValue(mockSalaryStructure as any);
      salaryStructureRepository.save.mockResolvedValue(mockSalaryStructure);

      const result = await service.createSalaryStructure(nullAllowancesDto, 'tenant-1');

      expect(result).toBeDefined();
    });

    it('should handle null deductions', async () => {
      const nullDeductionsDto = { ...createDto, deductions: null as any };
      salaryStructureRepository.create.mockReturnValue(mockSalaryStructure as any);
      salaryStructureRepository.save.mockResolvedValue(mockSalaryStructure);

      const result = await service.createSalaryStructure(nullDeductionsDto, 'tenant-1');

      expect(result).toBeDefined();
    });
  });

  describe('getSalaryStructure', () => {
    it('should get salary structure by id successfully', async () => {
      salaryStructureRepository.findOne.mockResolvedValue(mockSalaryStructure);

      const result = await service.getSalaryStructure('salary-1', 'tenant-1');

      expect(result).toEqual(mockSalaryStructure);
      expect(salaryStructureRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'salary-1', tenantId: 'tenant-1' },
        relations: ['employee'],
      });
    });

    it('should throw NotFoundException when not found', async () => {
      salaryStructureRepository.findOne.mockResolvedValue(null);

      await expect(service.getSalaryStructure('salary-999', 'tenant-1')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getSalaryStructure('salary-999', 'tenant-1')).rejects.toThrow(
        'Salary structure not found',
      );
    });

    it('should handle null id', async () => {
      salaryStructureRepository.findOne.mockResolvedValue(null);

      await expect(service.getSalaryStructure(null as any, 'tenant-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle empty id', async () => {
      salaryStructureRepository.findOne.mockResolvedValue(null);

      await expect(service.getSalaryStructure('', 'tenant-1')).rejects.toThrow(NotFoundException);
    });

    it('should handle undefined tenantId', async () => {
      salaryStructureRepository.findOne.mockResolvedValue(null);

      await expect(service.getSalaryStructure('salary-1', undefined as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getSalaryStructuresByEmployee', () => {
    it('should get salary structures by employee id', async () => {
      salaryStructureRepository.find.mockResolvedValue([mockSalaryStructure]);

      const result = await service.getSalaryStructuresByEmployee('emp-1', 'tenant-1');

      expect(result).toEqual([mockSalaryStructure]);
      expect(salaryStructureRepository.find).toHaveBeenCalledWith({
        where: { employeeId: 'emp-1', tenantId: 'tenant-1' },
        order: { effectiveFrom: 'DESC' },
      });
    });

    it('should return empty array when no structures found', async () => {
      salaryStructureRepository.find.mockResolvedValue([]);

      const result = await service.getSalaryStructuresByEmployee('emp-999', 'tenant-1');

      expect(result).toEqual([]);
    });

    it('should handle null employeeId', async () => {
      salaryStructureRepository.find.mockResolvedValue([]);

      const result = await service.getSalaryStructuresByEmployee(null as any, 'tenant-1');

      expect(result).toEqual([]);
    });
  });

  describe('generatePayslip', () => {
    it('should generate payslip successfully', async () => {
      salaryStructureRepository.findOne.mockResolvedValue(mockSalaryStructure);
      payslipRepository.findOne.mockResolvedValue(null);
      payslipRepository.create.mockReturnValue(mockPayslip as any);
      payslipRepository.save.mockResolvedValue(mockPayslip);

      const result = await service.generatePayslip('salary-1', 1, 2024, 'tenant-1');

      expect(result).toEqual(mockPayslip);
      expect(payslipRepository.create).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        employeeId: 'emp-1',
        salaryStructureId: 'salary-1',
        month: 1,
        year: 2024,
        baseSalary: 5000,
        allowances: { housing: 1000, transport: 500 },
        deductions: { tax: 500, insurance: 200 },
        status: PayslipStatus.DRAFT,
      });
    });

    it('should throw NotFoundException when salary structure not found', async () => {
      salaryStructureRepository.findOne.mockResolvedValue(null);

      await expect(service.generatePayslip('salary-999', 1, 2024, 'tenant-1')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.generatePayslip('salary-999', 1, 2024, 'tenant-1')).rejects.toThrow(
        'Salary structure not found',
      );
    });

    it('should throw BadRequestException when payslip already exists', async () => {
      salaryStructureRepository.findOne.mockResolvedValue(mockSalaryStructure);
      payslipRepository.findOne.mockResolvedValue(mockPayslip);

      await expect(service.generatePayslip('salary-1', 1, 2024, 'tenant-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.generatePayslip('salary-1', 1, 2024, 'tenant-1')).rejects.toThrow(
        'Payslip already exists for this month',
      );
    });

    it('should handle month 12', async () => {
      salaryStructureRepository.findOne.mockResolvedValue(mockSalaryStructure);
      payslipRepository.findOne.mockResolvedValue(null);
      payslipRepository.create.mockReturnValue(mockPayslip as any);
      payslipRepository.save.mockResolvedValue(mockPayslip);

      const result = await service.generatePayslip('salary-1', 12, 2024, 'tenant-1');

      expect(result).toBeDefined();
    });

    it('should handle month 1', async () => {
      salaryStructureRepository.findOne.mockResolvedValue(mockSalaryStructure);
      payslipRepository.findOne.mockResolvedValue(null);
      payslipRepository.create.mockReturnValue(mockPayslip as any);
      payslipRepository.save.mockResolvedValue(mockPayslip);

      const result = await service.generatePayslip('salary-1', 1, 2024, 'tenant-1');

      expect(result).toBeDefined();
    });

    it('should handle invalid month 0', async () => {
      salaryStructureRepository.findOne.mockResolvedValue(mockSalaryStructure);
      payslipRepository.findOne.mockResolvedValue(null);
      payslipRepository.create.mockReturnValue(mockPayslip as any);
      payslipRepository.save.mockResolvedValue(mockPayslip);

      const result = await service.generatePayslip('salary-1', 0, 2024, 'tenant-1');

      expect(result).toBeDefined();
    });

    it('should handle invalid month 13', async () => {
      salaryStructureRepository.findOne.mockResolvedValue(mockSalaryStructure);
      payslipRepository.findOne.mockResolvedValue(null);
      payslipRepository.create.mockReturnValue(mockPayslip as any);
      payslipRepository.save.mockResolvedValue(mockPayslip);

      const result = await service.generatePayslip('salary-1', 13, 2024, 'tenant-1');

      expect(result).toBeDefined();
    });
  });

  describe('getPayslip', () => {
    it('should get payslip by id successfully', async () => {
      payslipRepository.findOne.mockResolvedValue(mockPayslip);

      const result = await service.getPayslip('payslip-1', 'tenant-1');

      expect(result).toEqual(mockPayslip);
      expect(payslipRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'payslip-1', tenantId: 'tenant-1' },
        relations: ['employee', 'salaryStructure'],
      });
    });

    it('should throw NotFoundException when not found', async () => {
      payslipRepository.findOne.mockResolvedValue(null);

      await expect(service.getPayslip('payslip-999', 'tenant-1')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getPayslip('payslip-999', 'tenant-1')).rejects.toThrow(
        'Payslip not found',
      );
    });

    it('should handle null id', async () => {
      payslipRepository.findOne.mockResolvedValue(null);

      await expect(service.getPayslip(null as any, 'tenant-1')).rejects.toThrow(NotFoundException);
    });

    it('should handle empty id', async () => {
      payslipRepository.findOne.mockResolvedValue(null);

      await expect(service.getPayslip('', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPayslipsByEmployee', () => {
    it('should get payslips by employee id', async () => {
      payslipRepository.find.mockResolvedValue([mockPayslip]);

      const result = await service.getPayslipsByEmployee('emp-1', 'tenant-1');

      expect(result).toEqual([mockPayslip]);
      expect(payslipRepository.find).toHaveBeenCalledWith({
        where: { employeeId: 'emp-1', tenantId: 'tenant-1' },
        order: { year: 'DESC', month: 'DESC' },
      });
    });

    it('should return empty array when no payslips found', async () => {
      payslipRepository.find.mockResolvedValue([]);

      const result = await service.getPayslipsByEmployee('emp-999', 'tenant-1');

      expect(result).toEqual([]);
    });
  });

  describe('getPayslipsByMonth', () => {
    it('should get payslips by month and year', async () => {
      payslipRepository.find.mockResolvedValue([mockPayslip]);

      const result = await service.getPayslipsByMonth(1, 2024, 'tenant-1');

      expect(result).toEqual([mockPayslip]);
      expect(payslipRepository.find).toHaveBeenCalledWith({
        where: { month: 1, year: 2024, tenantId: 'tenant-1' },
        relations: ['employee'],
      });
    });

    it('should return empty array when no payslips found', async () => {
      payslipRepository.find.mockResolvedValue([]);

      const result = await service.getPayslipsByMonth(12, 2025, 'tenant-1');

      expect(result).toEqual([]);
    });

    it('should handle month 12', async () => {
      payslipRepository.find.mockResolvedValue([mockPayslip]);

      const result = await service.getPayslipsByMonth(12, 2024, 'tenant-1');

      expect(result).toBeDefined();
    });

    it('should handle month 1', async () => {
      payslipRepository.find.mockResolvedValue([mockPayslip]);

      const result = await service.getPayslipsByMonth(1, 2024, 'tenant-1');

      expect(result).toBeDefined();
    });
  });

  describe('submitPayslip', () => {
    it('should submit payslip successfully', async () => {
      payslipRepository.findOne.mockResolvedValue(mockPayslip);
      payslipRepository.save.mockResolvedValue({
        ...mockPayslip,
        status: PayslipStatus.SUBMITTED,
      });

      const result = await service.submitPayslip('payslip-1', 'tenant-1');

      expect(result.status).toBe(PayslipStatus.SUBMITTED);
      expect(payslipRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when payslip not draft', async () => {
      payslipRepository.findOne.mockResolvedValue({
        ...mockPayslip,
        status: PayslipStatus.PAID,
      });

      await expect(service.submitPayslip('payslip-1', 'tenant-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.submitPayslip('payslip-1', 'tenant-1')).rejects.toThrow(
        'Only draft payslips can be submitted',
      );
    });

    it('should throw NotFoundException when payslip not found', async () => {
      payslipRepository.findOne.mockResolvedValue(null);

      await expect(service.submitPayslip('payslip-999', 'tenant-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markAsPaid', () => {
    const paymentDate = new Date('2024-01-31');

    it('should mark payslip as paid successfully', async () => {
      payslipRepository.findOne.mockResolvedValue({
        ...mockPayslip,
        status: PayslipStatus.SUBMITTED,
      });
      payslipRepository.save.mockResolvedValue({
        ...mockPayslip,
        status: PayslipStatus.PAID,
        paymentDate,
      });

      const result = await service.markAsPaid('payslip-1', paymentDate, 'tenant-1');

      expect(result.status).toBe(PayslipStatus.PAID);
      expect(result.paymentDate).toEqual(paymentDate);
      expect(payslipRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when payslip not submitted', async () => {
      payslipRepository.findOne.mockResolvedValue(mockPayslip);

      await expect(service.markAsPaid('payslip-1', paymentDate, 'tenant-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.markAsPaid('payslip-1', paymentDate, 'tenant-1')).rejects.toThrow(
        'Only submitted payslips can be marked as paid',
      );
    });

    it('should throw NotFoundException when payslip not found', async () => {
      payslipRepository.findOne.mockResolvedValue(null);

      await expect(service.markAsPaid('payslip-999', paymentDate, 'tenant-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle null payment date', async () => {
      payslipRepository.findOne.mockResolvedValue({
        ...mockPayslip,
        status: PayslipStatus.SUBMITTED,
      });
      payslipRepository.save.mockResolvedValue({
        ...mockPayslip,
        status: PayslipStatus.PAID,
      });

      const result = await service.markAsPaid('payslip-1', null as any, 'tenant-1');

      expect(result.status).toBe(PayslipStatus.PAID);
    });
  });

  describe('cancelPayslip', () => {
    it('should cancel payslip successfully', async () => {
      payslipRepository.findOne.mockResolvedValue(mockPayslip);
      payslipRepository.save.mockResolvedValue({
        ...mockPayslip,
        status: PayslipStatus.CANCELLED,
      });

      const result = await service.cancelPayslip('payslip-1', 'tenant-1');

      expect(result.status).toBe(PayslipStatus.CANCELLED);
      expect(payslipRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when payslip is paid', async () => {
      payslipRepository.findOne.mockResolvedValue({
        ...mockPayslip,
        status: PayslipStatus.PAID,
      });

      await expect(service.cancelPayslip('payslip-1', 'tenant-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.cancelPayslip('payslip-1', 'tenant-1')).rejects.toThrow(
        'Paid payslips cannot be cancelled',
      );
    });

    it('should throw NotFoundException when payslip not found', async () => {
      payslipRepository.findOne.mockResolvedValue(null);

      await expect(service.cancelPayslip('payslip-999', 'tenant-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should cancel submitted payslip', async () => {
      payslipRepository.findOne.mockResolvedValue({
        ...mockPayslip,
        status: PayslipStatus.SUBMITTED,
      });
      payslipRepository.save.mockResolvedValue({
        ...mockPayslip,
        status: PayslipStatus.CANCELLED,
      });

      const result = await service.cancelPayslip('payslip-1', 'tenant-1');

      expect(result.status).toBe(PayslipStatus.CANCELLED);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large base salary', async () => {
      const largeSalary = { ...mockSalaryStructure, baseSalary: 999999999 };
      salaryStructureRepository.findOne.mockResolvedValue(largeSalary);

      const result = await service.getSalaryStructure('salary-1', 'tenant-1');

      expect(result.baseSalary).toBe(999999999);
    });

    it('should handle negative base salary', async () => {
      const negativeSalary = { ...mockSalaryStructure, baseSalary: -1000 };
      salaryStructureRepository.create.mockReturnValue(negativeSalary as any);
      salaryStructureRepository.save.mockResolvedValue(negativeSalary);

      const dto: CreateSalaryStructureDto = {
        employeeId: 'emp-1',
        baseSalary: -1000,
        allowances: {},
        deductions: {},
        effectiveFrom: new Date(),
      };

      const result = await service.createSalaryStructure(dto, 'tenant-1');

      expect(result).toBeDefined();
    });

    it('should handle undefined tenantId', async () => {
      salaryStructureRepository.findOne.mockResolvedValue(null);

      await expect(service.getSalaryStructure('salary-1', undefined as any)).rejects.toThrow();
    });

    it('should handle null tenantId', async () => {
      salaryStructureRepository.findOne.mockResolvedValue(null);

      await expect(service.getSalaryStructure('salary-1', null as any)).rejects.toThrow();
    });
  });
});
