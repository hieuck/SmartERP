import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportService } from './report.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  // Dashboard
  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard summary' })
  getDashboardSummary(@TenantId() tenantId: string) {
    return this.reportService.getDashboardSummary(tenantId);
  }

  // Inventory Reports
  @Get('inventory')
  @ApiOperation({ summary: 'Get inventory report' })
  getInventoryReport(@TenantId() tenantId: string) {
    return this.reportService.getInventoryReport(tenantId);
  }

  @Get('inventory/low-stock')
  @ApiOperation({ summary: 'Get low stock report' })
  getLowStockReport(@TenantId() tenantId: string) {
    return this.reportService.getLowStockReport(tenantId);
  }

  // Sales Reports
  @Get('sales')
  @ApiOperation({ summary: 'Get sales report' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  getSalesReport(
    @TenantId() tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return this.reportService.getSalesReport(tenantId, start, end);
  }

  @Get('sales/top-products')
  @ApiOperation({ summary: 'Get top selling products' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiQuery({ name: 'limit', required: false })
  getTopProducts(
    @TenantId() tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('limit') limit?: number,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return this.reportService.getTopProducts(tenantId, start, end, limit || 10);
  }

  // Customer Reports
  @Get('customers')
  @ApiOperation({ summary: 'Get customer report' })
  getCustomerReport(@TenantId() tenantId: string) {
    return this.reportService.getCustomerReport(tenantId);
  }

  // Production Reports
  @Get('materials')
  @ApiOperation({ summary: 'Get materials report' })
  getMaterialsReport(@TenantId() tenantId: string) {
    return this.reportService.getMaterialsReport(tenantId);
  }
}
