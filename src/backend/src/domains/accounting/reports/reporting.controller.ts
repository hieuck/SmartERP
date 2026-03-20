import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/common/security/permission.service';
import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { ReportsService } from './reports.service';

type DateRangeQuery = {
  startDate?: string;
  endDate?: string;
  limit?: string;
};

@ApiTags('Reporting')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reporting')
export class ReportingController {
  constructor(private readonly reportsService: ReportsService) {}

  private resolveDateRange(query: DateRangeQuery) {
    return {
      startDate: query.startDate ? new Date(query.startDate) : new Date('1970-01-01'),
      endDate: query.endDate ? new Date(query.endDate) : new Date(),
    };
  }

  private async buildSalesReport(user: User, query: DateRangeQuery) {
    const { startDate, endDate } = this.resolveDateRange(query);
    const summary = await this.reportsService.getSalesSummary(user, startDate, endDate);

    return {
      totalRevenue: summary.totalSales,
      totalOrders: summary.totalInvoices,
      averageOrderValue: summary.averageOrderValue,
      topProducts: [],
      topCustomers: summary.salesByCustomer.map((customer) => ({
        customerId: customer.customerId,
        customerName: customer.customerName,
        totalSpent: customer.totalSales,
        orderCount: customer.invoiceCount,
      })),
      dailySales: [],
    };
  }

  private async buildInventoryReport(user: User) {
    const summary = await this.reportsService.getInventorySummary(user);
    return {
      totalProducts: summary.totalProducts,
      totalValue: summary.totalValue,
      lowStockItems: summary.lowStockCount,
      outOfStockItems: summary.products.filter((product) => product.quantity <= 0).length,
      warehouseBreakdown: [],
      categoryBreakdown: [],
      products: summary.products,
    };
  }

  private async buildCustomerReport(user: User, query: DateRangeQuery) {
    const sales = await this.buildSalesReport(user, query);
    return {
      totalCustomers: sales.topCustomers.length,
      activeCustomers: sales.topCustomers.length,
      newCustomers: 0,
      topCustomers: sales.topCustomers,
      customersByStatus: {
        active: sales.topCustomers.length,
      },
    };
  }

  private async buildFinancialReport(user: User, query: DateRangeQuery) {
    const { startDate, endDate } = this.resolveDateRange(query);
    const sales = await this.reportsService.getSalesSummary(user, startDate, endDate);
    const cashFlow = (await this.reportsService.getCashFlowStatement(user, startDate, endDate)) as {
      netCashFlow?: number;
      operating?: { activities?: Array<{ date?: string; amount?: number }> };
    };

    return {
      totalRevenue: sales.totalSales,
      totalExpenses: 0,
      netProfit: sales.totalSales,
      profitMargin: sales.totalSales > 0 ? 100 : 0,
      accountsReceivable: sales.totalOutstanding,
      accountsPayable: 0,
      cashFlow: Array.isArray(cashFlow.operating?.activities) ? cashFlow.operating.activities : [],
    };
  }

  private async sendExport(
    res: Response,
    filename: string,
    payload: unknown,
    type: 'pdf' | 'excel',
  ) {
    const contentType =
      type === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=\"${filename}\"`);
    res.send(Buffer.from(JSON.stringify(payload, null, 2), 'utf8'));
  }

  @Get('sales')
  @ApiOperation({ summary: 'Get sales report for dashboard reporting UI' })
  async getSales(@CurrentUser() user: User, @Query() query: DateRangeQuery) {
    return this.buildSalesReport(user, query);
  }

  @Get('daily-sales')
  @ApiOperation({ summary: 'Get daily sales series for dashboard reporting UI' })
  async getDailySales(@CurrentUser() user: User, @Query() query: DateRangeQuery) {
    const sales = await this.buildSalesReport(user, query);
    return sales.dailySales;
  }

  @Get('product-performance')
  @ApiOperation({ summary: 'Get product performance series for dashboard reporting UI' })
  async getProductPerformance() {
    return [];
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Get inventory report for dashboard reporting UI' })
  async getInventory(@CurrentUser() user: User) {
    return this.buildInventoryReport(user);
  }

  @Get('inventory/low-stock')
  @ApiOperation({ summary: 'Get low stock products for dashboard reporting UI' })
  async getLowStock(@CurrentUser() user: User) {
    const summary = await this.reportsService.getInventorySummary(user, undefined, undefined, true);
    return summary.products;
  }

  @Get('inventory/movements')
  @ApiOperation({ summary: 'Get inventory movement report for dashboard reporting UI' })
  async getInventoryMovements(@CurrentUser() user: User, @Query() query: DateRangeQuery) {
    const { startDate, endDate } = this.resolveDateRange(query);
    const result = await this.reportsService.getInventoryMovement(user, startDate, endDate);
    return result.movements;
  }

  @Get('customers')
  @ApiOperation({ summary: 'Get customer report for dashboard reporting UI' })
  async getCustomers(@CurrentUser() user: User, @Query() query: DateRangeQuery) {
    return this.buildCustomerReport(user, query);
  }

  @Get('customers/top')
  @ApiOperation({ summary: 'Get top customers for dashboard reporting UI' })
  async getTopCustomers(@CurrentUser() user: User, @Query() query: DateRangeQuery) {
    const report = await this.buildCustomerReport(user, query);
    const limit = Number(query.limit ?? 10);
    return report.topCustomers.slice(0, limit);
  }

  @Get('financial')
  @ApiOperation({ summary: 'Get financial overview for dashboard reporting UI' })
  async getFinancial(@CurrentUser() user: User, @Query() query: DateRangeQuery) {
    return this.buildFinancialReport(user, query);
  }

  @Get('financial/profit-loss')
  @ApiOperation({ summary: 'Get profit and loss summary for dashboard reporting UI' })
  async getProfitLoss(@CurrentUser() user: User, @Query() query: DateRangeQuery) {
    const financial = await this.buildFinancialReport(user, query);
    return {
      revenue: financial.totalRevenue,
      expenses: financial.totalExpenses,
      netProfit: financial.netProfit,
      profitMargin: financial.profitMargin,
    };
  }

  @Get('financial/cash-flow')
  @ApiOperation({ summary: 'Get cash flow summary for dashboard reporting UI' })
  async getReportingCashFlow(@CurrentUser() user: User, @Query() query: DateRangeQuery) {
    const { startDate, endDate } = this.resolveDateRange(query);
    return this.reportsService.getCashFlowStatement(user, startDate, endDate);
  }

  @Get('sales/export/:format')
  async exportSales(
    @CurrentUser() user: User,
    @Param('format') format: 'pdf' | 'excel',
    @Query() query: DateRangeQuery,
    @Res() res: Response,
  ) {
    const payload = await this.buildSalesReport(user, query);
    await this.sendExport(res, 'sales-report.json', payload, format);
  }

  @Get('inventory/export/:format')
  async exportInventory(
    @CurrentUser() user: User,
    @Param('format') format: 'pdf' | 'excel',
    @Query() query: DateRangeQuery,
    @Res() res: Response,
  ) {
    const payload = await this.buildInventoryReport(user);
    await this.sendExport(res, 'inventory-report.json', payload, format);
  }

  @Get('customers/export/:format')
  async exportCustomers(
    @CurrentUser() user: User,
    @Param('format') format: 'pdf' | 'excel',
    @Query() query: DateRangeQuery,
    @Res() res: Response,
  ) {
    const payload = await this.buildCustomerReport(user, query);
    await this.sendExport(res, 'customer-report.json', payload, format);
  }

  @Get('financial/export/:format')
  async exportFinancial(
    @CurrentUser() user: User,
    @Param('format') format: 'pdf' | 'excel',
    @Query() query: DateRangeQuery,
    @Res() res: Response,
  ) {
    const payload = await this.buildFinancialReport(user, query);
    await this.sendExport(res, 'financial-report.json', payload, format);
  }
}
