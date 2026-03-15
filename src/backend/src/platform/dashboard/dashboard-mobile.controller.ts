import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { User } from '@/common/security/permission.service';
import {
  MobileDashboardStatsDto,
  MobileChartQueryDto,
  MobileChartDataDto,
  MobileTopItemsQueryDto,
  RecentOrderDto,
  LowStockProductDto,
} from './dto';

@ApiTags('dashboard-mobile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('api/v1/dashboard')
export class DashboardMobileController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard stats (Mobile App)' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard stats retrieved successfully',
    type: MobileDashboardStatsDto,
  })
  async getStats(@CurrentUser() user: User): Promise<MobileDashboardStatsDto> {
    return this.dashboardService.getMobileStats(user);
  }

  @Get('revenue-chart')
  @ApiOperation({ summary: 'Get revenue chart data (Mobile App)' })
  @ApiResponse({
    status: 200,
    description: 'Revenue chart data retrieved successfully',
    type: MobileChartDataDto,
  })
  async getRevenueChart(
    @CurrentUser() user: User,
    @Query() query: MobileChartQueryDto,
  ): Promise<MobileChartDataDto> {
    return this.dashboardService.getRevenueChart(user, query.period);
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Get top selling products (Mobile App)' })
  @ApiResponse({
    status: 200,
    description: 'Top products retrieved successfully',
    type: MobileChartDataDto,
  })
  async getTopProducts(
    @CurrentUser() user: User,
    @Query() query: MobileTopItemsQueryDto,
  ): Promise<MobileChartDataDto> {
    const products = await this.dashboardService.getTopProducts(user, query.limit || 5);
    return {
      labels: products.map((p) => p.name),
      values: products.map((p) => p.revenue),
    };
  }

  @Get('recent-orders')
  @ApiOperation({ summary: 'Get recent orders (Mobile App)' })
  @ApiResponse({
    status: 200,
    description: 'Recent orders retrieved successfully',
    type: [RecentOrderDto],
  })
  async getRecentOrders(
    @CurrentUser() user: User,
    @Query() query: MobileTopItemsQueryDto,
  ): Promise<RecentOrderDto[]> {
    return this.dashboardService.getRecentOrders(user, query.limit || 5);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get low stock products (Mobile App)' })
  @ApiResponse({
    status: 200,
    description: 'Low stock products retrieved successfully',
    type: [LowStockProductDto],
  })
  async getLowStock(
    @CurrentUser() user: User,
    @Query() query: MobileTopItemsQueryDto,
  ): Promise<LowStockProductDto[]> {
    return this.dashboardService.getLowStockProducts(user, query.limit || 10);
  }
}
