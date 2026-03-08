import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { User } from '@/common/security/permission.service';
import {
  DashboardOverviewDto,
  SalesChartQueryDto,
  SalesChartDataDto,
  TopItemsQueryDto,
  TopProductDto,
  TopCustomerDto,
  RevenueByCategoryDto,
} from './dto';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get dashboard overview (Frontend Web)' })
  @ApiResponse({ status: 200, description: 'Dashboard overview retrieved successfully', type: DashboardOverviewDto })
  async getOverview(@CurrentUser() user: User): Promise<DashboardOverviewDto> {
    return this.dashboardService.getOverview(user);
  }

  @Get('sales-chart')
  @ApiOperation({ summary: 'Get sales chart data (Frontend Web)' })
  @ApiResponse({ status: 200, description: 'Sales chart data retrieved successfully', type: [SalesChartDataDto] })
  async getSalesChart(
    @CurrentUser() user: User,
    @Query() query: SalesChartQueryDto,
  ): Promise<SalesChartDataDto[]> {
    return this.dashboardService.getSalesChart(user, query.days || 30);
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Get top selling products (Frontend Web)' })
  @ApiResponse({ status: 200, description: 'Top products retrieved successfully', type: [TopProductDto] })
  async getTopProducts(
    @CurrentUser() user: User,
    @Query() query: TopItemsQueryDto,
  ): Promise<TopProductDto[]> {
    return this.dashboardService.getTopProducts(user, query.limit || 10);
  }

  @Get('top-customers')
  @ApiOperation({ summary: 'Get top customers (Frontend Web)' })
  @ApiResponse({ status: 200, description: 'Top customers retrieved successfully', type: [TopCustomerDto] })
  async getTopCustomers(
    @CurrentUser() user: User,
    @Query() query: TopItemsQueryDto,
  ): Promise<TopCustomerDto[]> {
    return this.dashboardService.getTopCustomers(user, query.limit || 10);
  }

  @Get('revenue-by-category')
  @ApiOperation({ summary: 'Get revenue by category (Frontend Web)' })
  @ApiResponse({ status: 200, description: 'Revenue by category retrieved successfully', type: [RevenueByCategoryDto] })
  async getRevenueByCategory(@CurrentUser() user: User): Promise<RevenueByCategoryDto[]> {
    return this.dashboardService.getRevenueByCategory(user);
  }
}
