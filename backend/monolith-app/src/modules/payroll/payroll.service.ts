import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { PayrollPeriod, PayrollPeriodStatus } from './entities/payroll-period.entity';
import { Payslip, PayslipStatus } from './entities/payslip.entity';
import { PieceRateWork, PieceRateStatus } from './entities/piece-rate-work.entity';
import { WorkOrder, WorkOrderStatus } from './entities/work-order.entity';
import { Employee } from '../hr/entities/employee.entity';
import { Attendance } from '../hr/entities/attendance.entity';
import { CacheService } from '@/common/cache/cache.service';
import { CacheTTL, generateCacheKey } from '@/common/cache/cache.config';

@Injectable()
export class PayrollService {
  constructor(
    @InjectRepository(PayrollPeriod)
    private periodRepository: Repository<PayrollPeriod>,
    @InjectRepository(Payslip)
    private payslipRepository: Repository<Payslip>,
    @InjectRepository(PieceRateWork)
    private pieceRateRepository: Repository<PieceRateWork>,
    @InjectRepository(WorkOrder)
    private workOrderRepository: Repository<WorkOrder>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    private readonly cacheService: CacheService,
  ) {}

  // Payroll Period Management
  async createPeriod(tenantId: string, data: Partial<PayrollPeriod>): Promise<PayrollPeriod> {
    const period = this.periodRepository.create({ ...data, tenantId });
    const savedPeriod = await this.periodRepository.save(period);

    // Invalidate cache for period list
    await this.cacheService.del(generateCacheKey('payroll-periods', tenantId, 'all'));

    return savedPeriod;
  }

  async findPeriodById(tenantId: string, id: string): Promise<PayrollPeriod> {
    const cacheKey = generateCacheKey('payroll-period', tenantId, id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const period = await this.periodRepository.findOne({ where: { tenantId, id } });
        if (!period) {
          throw new NotFoundException('Payroll period not found');
        }
        return period;
      },
      CacheTTL.MEDIUM,
    );
  }

  async findAllPeriods(tenantId: string): Promise<PayrollPeriod[]> {
    return this.periodRepository.find({
      where: { tenantId },
      order: { startDate: 'DESC' },
    });
  }

  // Piece Rate Work Management
  async createPieceRateWork(
    tenantId: string,
    data: Partial<PieceRateWork>,
  ): Promise<PieceRateWork> {
    const totalEarnings = data.quantityCompleted * data.ratePerUnit;
    const work = this.pieceRateRepository.create({
      ...data,
      tenantId,
      totalEarnings,
    });
    return this.pieceRateRepository.save(work);
  }

  async findPieceRateWorksByEmployee(
    tenantId: string,
    employeeId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<PieceRateWork[]> {
    const where: Record<string, unknown> = { tenantId, employeeId };
    if (startDate && endDate) {
      where.workDate = Between(startDate, endDate);
    }
    return this.pieceRateRepository.find({
      where,
      order: { workDate: 'DESC' },
    });
  }

  async approvePieceRateWork(
    tenantId: string,
    id: string,
    approvedBy: string,
  ): Promise<PieceRateWork> {
    await this.pieceRateRepository.update(
      { tenantId, id },
      {
        status: PieceRateStatus.APPROVED,
        approvedBy,
        approvedAt: new Date(),
      },
    );

    // Invalidate cache
    await this.cacheService.del(generateCacheKey('piece-rate-work', tenantId, id));

    return this.pieceRateRepository.findOne({ where: { tenantId, id } });
  }

  async findPieceRateWorkById(tenantId: string, id: string): Promise<PieceRateWork> {
    const cacheKey = generateCacheKey('piece-rate-work', tenantId, id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const work = await this.pieceRateRepository.findOne({ where: { tenantId, id } });
        if (!work) {
          throw new NotFoundException('Piece rate work not found');
        }
        return work;
      },
      CacheTTL.MEDIUM,
    );
  }

  // Work Order Management
  async createWorkOrder(tenantId: string, data: Partial<WorkOrder>): Promise<WorkOrder> {
    const workOrder = this.workOrderRepository.create({ ...data, tenantId });
    return this.workOrderRepository.save(workOrder);
  }

  async findAllWorkOrders(tenantId: string, status?: WorkOrderStatus): Promise<WorkOrder[]> {
    const where: Record<string, unknown> = { tenantId };
    if (status) {
      where.status = status;
    }
    return this.workOrderRepository.find({
      where,
      order: { plannedStartDate: 'DESC' },
    });
  }

  async updateWorkOrderStatus(
    tenantId: string,
    id: string,
    status: WorkOrderStatus,
  ): Promise<WorkOrder> {
    const updates: Record<string, unknown> = { status };
    if (status === WorkOrderStatus.IN_PROGRESS && !updates.actualStartDate) {
      updates.actualStartDate = new Date();
    }
    if (status === WorkOrderStatus.COMPLETED) {
      updates.actualEndDate = new Date();
    }
    await this.workOrderRepository.update({ tenantId, id }, updates);

    // Invalidate cache
    await this.cacheService.del(generateCacheKey('work-order', tenantId, id));

    return this.workOrderRepository.findOne({ where: { tenantId, id } });
  }

  async findWorkOrderById(tenantId: string, id: string): Promise<WorkOrder> {
    const cacheKey = generateCacheKey('work-order', tenantId, id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const workOrder = await this.workOrderRepository.findOne({ where: { tenantId, id } });
        if (!workOrder) {
          throw new NotFoundException('Work order not found');
        }
        return workOrder;
      },
      CacheTTL.MEDIUM,
    );
  }

  // Payslip Generation
  async generatePayslips(tenantId: string, periodId: string): Promise<Payslip[]> {
    const period = await this.findPeriodById(tenantId, periodId);

    const employees = await this.employeeRepository.find({ where: { tenantId } });

    // Batch load all attendances for the period (fix N+1)
    const allAttendances = await this.attendanceRepository.find({
      where: {
        tenantId,
        date: Between(period.startDate, period.endDate),
      },
    });

    // Batch load all piece rate works for the period (fix N+1)
    const allPieceRateWorks = await this.pieceRateRepository.find({
      where: {
        tenantId,
        workDate: Between(period.startDate, period.endDate),
        status: PieceRateStatus.APPROVED,
      },
    });

    // Group by employee for efficient lookup
    const attendancesByEmployee = new Map<string, typeof allAttendances>();
    allAttendances.forEach((attendance) => {
      if (!attendancesByEmployee.has(attendance.employeeId)) {
        attendancesByEmployee.set(attendance.employeeId, []);
      }
      attendancesByEmployee.get(attendance.employeeId).push(attendance);
    });

    const pieceRateWorksByEmployee = new Map<string, typeof allPieceRateWorks>();
    allPieceRateWorks.forEach((work) => {
      if (!pieceRateWorksByEmployee.has(work.employeeId)) {
        pieceRateWorksByEmployee.set(work.employeeId, []);
      }
      pieceRateWorksByEmployee.get(work.employeeId).push(work);
    });

    const payslips: Payslip[] = [];
    const totalDays = this.getDaysBetween(period.startDate, period.endDate);

    for (const employee of employees) {
      // Get pre-loaded data
      const attendances = attendancesByEmployee.get(employee.id) || [];
      const pieceRateWorks = pieceRateWorksByEmployee.get(employee.id) || [];

      const workingDays = attendances.filter(
        (a) => a.status === 'present' || a.status === 'late',
      ).length;
      const absentDays = attendances.filter((a) => a.status === 'absent').length;

      const pieceRateEarnings = pieceRateWorks.reduce(
        (sum, work) => sum + Number(work.totalEarnings),
        0,
      );

      // Calculate base salary (prorated by working days)
      const baseSalary = employee.salary || 0;
      const proratedSalary = (baseSalary / totalDays) * workingDays;

      // Calculate net salary
      const netSalary = proratedSalary + pieceRateEarnings;

      const payslip = this.payslipRepository.create({
        tenantId,
        employeeId: employee.id,
        payrollPeriodId: periodId,
        baseSalary: proratedSalary,
        pieceRateEarnings,
        attendanceBonus: 0,
        overtimePay: 0,
        allowances: 0,
        deductions: 0,
        netSalary,
        workingDays,
        absentDays,
        overtimeHours: 0,
        status: PayslipStatus.DRAFT,
        breakdown: {
          totalDays,
          workingDays,
          absentDays,
          pieceRateWorks: pieceRateWorks.length,
        },
      });

      payslips.push(payslip);
    }

    // Batch save all payslips (more efficient than individual saves)
    const savedPayslips = await this.payslipRepository.save(payslips);

    // Update period status
    await this.periodRepository.update(
      { tenantId, id: periodId },
      { status: PayrollPeriodStatus.PROCESSING },
    );

    return savedPayslips;
  }

  async findPayslipsByPeriod(tenantId: string, periodId: string): Promise<Payslip[]> {
    return this.payslipRepository.find({
      where: { tenantId, payrollPeriodId: periodId },
    });
  }

  async confirmPayslip(tenantId: string, id: string): Promise<Payslip> {
    await this.payslipRepository.update({ tenantId, id }, { status: PayslipStatus.CONFIRMED });

    // Invalidate cache
    await this.cacheService.del(generateCacheKey('payslip', tenantId, id));

    return this.payslipRepository.findOne({ where: { tenantId, id } });
  }

  async findPayslipById(tenantId: string, id: string): Promise<Payslip> {
    const cacheKey = generateCacheKey('payslip', tenantId, id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const payslip = await this.payslipRepository.findOne({ where: { tenantId, id } });
        if (!payslip) {
          throw new NotFoundException('Payslip not found');
        }
        return payslip;
      },
      CacheTTL.MEDIUM,
    );
  }

  private getDaysBetween(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }
}
