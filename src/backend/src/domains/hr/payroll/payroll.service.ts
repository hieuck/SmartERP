import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalaryStructure } from './entities/salary-structure.entity';
import { Payslip } from './entities/payslip.entity';
import { PayslipStatus } from './enums/payslip-status.enum';
import { CreateSalaryStructureDto } from './dto/create-salary-structure.dto';

@Injectable()
export class PayrollService {
  constructor(
    @InjectRepository(SalaryStructure)
    private readonly salaryStructureRepository: Repository<SalaryStructure>,
    @InjectRepository(Payslip)
    private readonly payslipRepository: Repository<Payslip>,
  ) {}

  async createSalaryStructure(
    dto: CreateSalaryStructureDto,
    tenantId: string,
  ): Promise<SalaryStructure> {
    const structure = this.salaryStructureRepository.create({
      ...dto,
      tenantId,
    });

    return this.salaryStructureRepository.save(structure);
  }

  async getSalaryStructure(id: string, tenantId: string): Promise<SalaryStructure> {
    const structure = await this.salaryStructureRepository.findOne({
      where: { id, tenantId },
      relations: ['employee'],
    });

    if (!structure) {
      throw new NotFoundException('Salary structure not found');
    }

    return structure;
  }

  async getSalaryStructuresByEmployee(
    employeeId: string,
    tenantId: string,
  ): Promise<SalaryStructure[]> {
    return this.salaryStructureRepository.find({
      where: { employeeId, tenantId },
      order: { effectiveFrom: 'DESC' },
    });
  }

  async generatePayslip(
    salaryStructureId: string,
    month: number,
    year: number,
    tenantId: string,
  ): Promise<Payslip> {
    const structure = await this.salaryStructureRepository.findOne({
      where: { id: salaryStructureId, tenantId },
    });

    if (!structure) {
      throw new NotFoundException('Salary structure not found');
    }

    const existing = await this.payslipRepository.findOne({
      where: {
        salaryStructureId,
        month,
        year,
        tenantId,
      },
    });

    if (existing) {
      throw new BadRequestException('Payslip already exists for this month');
    }

    const payslip = this.payslipRepository.create({
      tenantId,
      employeeId: structure.employeeId,
      salaryStructureId: structure.id,
      month,
      year,
      baseSalary: structure.baseSalary,
      allowances: structure.allowances,
      deductions: structure.deductions,
      status: PayslipStatus.DRAFT,
    });

    return this.payslipRepository.save(payslip);
  }

  async getPayslip(id: string, tenantId: string): Promise<Payslip> {
    const payslip = await this.payslipRepository.findOne({
      where: { id, tenantId },
      relations: ['employee', 'salaryStructure'],
    });

    if (!payslip) {
      throw new NotFoundException('Payslip not found');
    }

    return payslip;
  }

  async getPayslipsByEmployee(employeeId: string, tenantId: string): Promise<Payslip[]> {
    return this.payslipRepository.find({
      where: { employeeId, tenantId },
      order: { year: 'DESC', month: 'DESC' },
    });
  }

  async getPayslipsByMonth(month: number, year: number, tenantId: string): Promise<Payslip[]> {
    return this.payslipRepository.find({
      where: { month, year, tenantId },
      relations: ['employee'],
    });
  }

  async submitPayslip(id: string, tenantId: string): Promise<Payslip> {
    const payslip = await this.getPayslip(id, tenantId);

    if (payslip.status !== PayslipStatus.DRAFT) {
      throw new BadRequestException('Only draft payslips can be submitted');
    }

    payslip.status = PayslipStatus.SUBMITTED;
    return this.payslipRepository.save(payslip);
  }

  async markAsPaid(id: string, paymentDate: Date, tenantId: string): Promise<Payslip> {
    const payslip = await this.getPayslip(id, tenantId);

    if (payslip.status !== PayslipStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted payslips can be marked as paid');
    }

    payslip.status = PayslipStatus.PAID;
    payslip.paymentDate = paymentDate;
    return this.payslipRepository.save(payslip);
  }

  async cancelPayslip(id: string, tenantId: string): Promise<Payslip> {
    const payslip = await this.getPayslip(id, tenantId);

    if (payslip.status === PayslipStatus.PAID) {
      throw new BadRequestException('Paid payslips cannot be cancelled');
    }

    payslip.status = PayslipStatus.CANCELLED;
    return this.payslipRepository.save(payslip);
  }
}
