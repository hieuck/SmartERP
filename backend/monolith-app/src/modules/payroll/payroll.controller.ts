import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { PayrollPeriod } from './entities/payroll-period.entity';
import { Payslip } from './entities/payslip.entity';
import { PieceRateWork } from './entities/piece-rate-work.entity';
import { WorkOrder, WorkOrderStatus } from './entities/work-order.entity';

@Controller('payroll')
@UseGuards(JwtAuthGuard)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  // Payroll Period Endpoints
  @Get('periods')
  async findAllPeriods(@TenantId() tenantId: string): Promise<PayrollPeriod[]> {
    return this.payrollService.findAllPeriods(tenantId);
  }

  @Post('periods')
  async createPeriod(
    @TenantId() tenantId: string,
    @Body() data: Partial<PayrollPeriod>,
  ): Promise<PayrollPeriod> {
    return this.payrollService.createPeriod(tenantId, data);
  }

  // Piece Rate Work Endpoints
  @Post('piece-rate-works')
  async createPieceRateWork(
    @TenantId() tenantId: string,
    @Body() data: Partial<PieceRateWork>,
  ): Promise<PieceRateWork> {
    return this.payrollService.createPieceRateWork(tenantId, data);
  }

  @Get('piece-rate-works/employee/:employeeId')
  async findPieceRateWorksByEmployee(
    @TenantId() tenantId: string,
    @Param('employeeId') employeeId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<PieceRateWork[]> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.payrollService.findPieceRateWorksByEmployee(tenantId, employeeId, start, end);
  }

  @Post('piece-rate-works/:id/approve')
  async approvePieceRateWork(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body('approvedBy') approvedBy: string,
  ): Promise<PieceRateWork> {
    return this.payrollService.approvePieceRateWork(tenantId, id, approvedBy);
  }

  // Work Order Endpoints
  @Get('work-orders')
  async findAllWorkOrders(
    @TenantId() tenantId: string,
    @Query('status') status?: WorkOrderStatus,
  ): Promise<WorkOrder[]> {
    return this.payrollService.findAllWorkOrders(tenantId, status);
  }

  @Post('work-orders')
  async createWorkOrder(
    @TenantId() tenantId: string,
    @Body() data: Partial<WorkOrder>,
  ): Promise<WorkOrder> {
    return this.payrollService.createWorkOrder(tenantId, data);
  }

  @Put('work-orders/:id/status')
  async updateWorkOrderStatus(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body('status') status: WorkOrderStatus,
  ): Promise<WorkOrder> {
    return this.payrollService.updateWorkOrderStatus(tenantId, id, status);
  }

  // Payslip Endpoints
  @Post('periods/:periodId/generate-payslips')
  async generatePayslips(
    @TenantId() tenantId: string,
    @Param('periodId') periodId: string,
  ): Promise<Payslip[]> {
    return this.payrollService.generatePayslips(tenantId, periodId);
  }

  @Get('periods/:periodId/payslips')
  async findPayslipsByPeriod(
    @TenantId() tenantId: string,
    @Param('periodId') periodId: string,
  ): Promise<Payslip[]> {
    return this.payrollService.findPayslipsByPeriod(tenantId, periodId);
  }

  @Post('payslips/:id/confirm')
  async confirmPayslip(@TenantId() tenantId: string, @Param('id') id: string): Promise<Payslip> {
    return this.payrollService.confirmPayslip(tenantId, id);
  }
}
