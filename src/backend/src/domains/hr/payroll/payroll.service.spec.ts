import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { SalaryStructure } from './entities/salary-structure.entity';
import { Payslip } from './entities/payslip.entity';
import { PayslipStatus } from './enums/payslip-status.enum';
import { CreateSalaryStructureDto } from './dto/create-salary-structure.dto';

describe('PayrollService', () => {
  let service: PayrollService;
  let salaryStructureRepository: jest.Mocked<Repository<SalaryStructure>>;
  let payslipRepository: jest.Mocked<Repository<Payslip>>;

  const tenantId = 'tenant-1';
  const employeeId = 'employee-1';

  const mockSalaryStructure: SalaryStructure = {
    id: 'structure-1',
    employeeId,
    employee: null,
    baseSalary: 5000,
    allowances: 1500,
    deductions: 700,
    effectiveFrom: new Date('2024-01-01'),
    effectiveTo: null,
    isActive: true,
    tenantId,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as SalaryStructure;

  const mockPayslip: Payslip = {
    id: 'payslip-1',
    employeeId,
    employee: null,
    salaryStructureId: 'structure-1',
    salaryStructure: null,
    month: 1,
    year: 2024,
    baseSalary: 5000,
    allowances: 1500,
    deductions: 700,
    taxAmount: 0,
    grossSalary: 6500,
    netSalary: 5800,
    status: PayslipStatus.DRAFT,
    paymentDate: null,
    tenantId,
    createdAt: new Date(),
    updatedAt: new Date(),
    calculateSalary: jest.fn(),
    validate: jest.fn(),
  } as any;

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
    it('should create salary structure', async () => {
      const dto: CreateSalaryStructureDto = {
        employeeId,
        baseSalary: 5000,
        allowances: 1500,
        deductions: 700,
        effectiveFrom: new Date('2024-01-01'),
      };

      salaryStructureRepository.create.mockReturnValue(mockSalaryStructure);
      salaryStructureRepository.save.mockResolvedValue(mockSalaryStructure);

      const result = await service.createSalaryStructure(dto, tenantId);

      expect(result).toEqual(mockSalaryStructure);
      expect(salaryStructureRepository.create).toHaveBeenCalledWith({
        ...dto,
        tenantId,
      });
    });
  });

  describe('getSalaryStructure', () => {
    it('should return salary structure by id', async () => {
      salaryStructureRepository.findOne.mockResolvedValue(mockSalaryStructure);

      const result = await service.getSalaryStructure('structure-1', tenantId);

      expect(result).toEqual(mockSalaryStructure);
      expect(salaryStructureRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'structure-1', tenantId },
        relations: ['employee'],
      });
    });

    it('should throw NotFoundException when structure not found', async () => {
      salaryStructureRepository.findOne.mockResolvedValue(null);

      await expect(service.getSalaryStructure('invalid-id', tenantId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getSalaryStructuresByEmployee', () => {
    it('should return all salary structures for employee', async () => {
      const structures = [mockSalaryStructure];
      salaryStructureRepository.find.mockResolvedValue(structures);

      const result = await service.getSalaryStructuresByEmployee(employeeId, tenantId);

      expect(result).toEqual(structures);
      expect(salaryStructureRepository.find).toHaveBeenCalledWith({
        where: { employeeId, tenantId },
        order: { effectiveFrom: 'DESC' },
      });
    });
  });

  describe('generatePayslip', () => {
    it('should generate payslip for salary structure', async () => {
      salaryStructureRepository.findOne.mockResolvedValue(mockSalaryStructure);
      payslipRepository.findOne.mockResolvedValue(null);
      payslipRepository.create.mockReturnValue(mockPayslip);
      payslipRepository.save.mockResolvedValue(mockPayslip);

      const result = await service.generatePayslip('structure-1', 1, 2024, tenantId);

      expect(result).toEqual(mockPayslip);
      expect(payslipRepository.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when structure not found', async () => {
      salaryStructureRepository.findOne.mockResolvedValue(null);

      await expect(service.generatePayslip('invalid-id', 1, 2024, tenantId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when payslip already exists', async () => {
      salaryStructureRepository.findOne.mockResolvedValue(mockSalaryStructure);
      payslipRepository.findOne.mockResolvedValue(mockPayslip);

      await expect(service.generatePayslip('structure-1', 1, 2024, tenantId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getPayslip', () => {
    it('should return payslip by id', async () => {
      payslipRepository.findOne.mockResolvedValue(mockPayslip);

      const result = await service.getPayslip('payslip-1', tenantId);

      expect(result).toEqual(mockPayslip);
      expect(payslipRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'payslip-1', tenantId },
        relations: ['employee', 'salaryStructure'],
      });
    });

    it('should throw NotFoundException when payslip not found', async () => {
      payslipRepository.findOne.mockResolvedValue(null);

      await expect(service.getPayslip('invalid-id', tenantId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getPayslipsByEmployee', () => {
    it('should return all payslips for employee', async () => {
      const payslips = [mockPayslip];
      payslipRepository.find.mockResolvedValue(payslips);

      const result = await service.getPayslipsByEmployee(employeeId, tenantId);

      expect(result).toEqual(payslips);
      expect(payslipRepository.find).toHaveBeenCalledWith({
        where: { employeeId, tenantId },
        order: { year: 'DESC', month: 'DESC' },
      });
    });
  });

  describe('getPayslipsByMonth', () => {
    it('should return all payslips for specific month', async () => {
      const payslips = [mockPayslip];
      payslipRepository.find.mockResolvedValue(payslips);

      const result = await service.getPayslipsByMonth(1, 2024, tenantId);

      expect(result).toEqual(payslips);
      expect(payslipRepository.find).toHaveBeenCalledWith({
        where: { month: 1, year: 2024, tenantId },
        relations: ['employee'],
      });
    });
  });

  describe('submitPayslip', () => {
    it('should submit draft payslip', async () => {
      payslipRepository.findOne.mockResolvedValue(mockPayslip);
      const submittedPayslip = { ...mockPayslip, status: PayslipStatus.SUBMITTED } as any;
      payslipRepository.save.mockResolvedValue(submittedPayslip);

      const result = await service.submitPayslip('payslip-1', tenantId);

      expect(result.status).toBe(PayslipStatus.SUBMITTED);
    });

    it('should throw BadRequestException when payslip not draft', async () => {
      const submittedPayslip = { ...mockPayslip, status: PayslipStatus.SUBMITTED } as any;
      payslipRepository.findOne.mockResolvedValue(submittedPayslip);

      await expect(service.submitPayslip('payslip-1', tenantId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('markAsPaid', () => {
    it('should mark submitted payslip as paid', async () => {
      const submittedPayslip = { ...mockPayslip, status: PayslipStatus.SUBMITTED } as any;
      const paymentDate = new Date('2024-01-31');
      payslipRepository.findOne.mockResolvedValue(submittedPayslip);
      const paidPayslip = {
        ...submittedPayslip,
        status: PayslipStatus.PAID,
        paymentDate,
      } as any;
      payslipRepository.save.mockResolvedValue(paidPayslip);

      const result = await service.markAsPaid('payslip-1', paymentDate, tenantId);

      expect(result.status).toBe(PayslipStatus.PAID);
      expect(result.paymentDate).toEqual(paymentDate);
    });

    it('should throw BadRequestException when payslip not submitted', async () => {
      // Mock payslip with DRAFT status (not SUBMITTED)
      const draftPayslip = { ...mockPayslip, status: PayslipStatus.DRAFT } as any;
      payslipRepository.findOne.mockResolvedValue(draftPayslip);

      await expect(
        service.markAsPaid('payslip-1', new Date(), tenantId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelPayslip', () => {
    it('should cancel draft payslip', async () => {
      // Mock payslip with DRAFT status
      const draftPayslip = { ...mockPayslip, status: PayslipStatus.DRAFT } as any;
      payslipRepository.findOne.mockResolvedValue(draftPayslip);
      const cancelledPayslip = { ...draftPayslip, status: PayslipStatus.CANCELLED } as any;
      payslipRepository.save.mockResolvedValue(cancelledPayslip);

      const result = await service.cancelPayslip('payslip-1', tenantId);

      expect(result.status).toBe(PayslipStatus.CANCELLED);
    });

    it('should throw BadRequestException when payslip is paid', async () => {
      const paidPayslip = { ...mockPayslip, status: PayslipStatus.PAID } as any;
      payslipRepository.findOne.mockResolvedValue(paidPayslip);

      await expect(service.cancelPayslip('payslip-1', tenantId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
