import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  findAll(@TenantId() tenantId: string) {
    return this.orderService.findAll(tenantId);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending orders' })
  getPendingOrders(@TenantId() tenantId: string) {
    return this.orderService.getPendingOrders(tenantId);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get order count' })
  count(@TenantId() tenantId: string) {
    return this.orderService.count(tenantId);
  }

  @Get('recent/:limit')
  @ApiOperation({ summary: 'Get recent orders' })
  getRecentOrders(@Param('limit') limit: string, @TenantId() tenantId: string) {
    const numLimit = parseInt(limit, 10);
    if (isNaN(numLimit) || numLimit <= 0) {
      throw new BadRequestException('Invalid limit parameter');
    }
    return this.orderService.getRecentOrders(numLimit, tenantId);
  }

  @Get('revenue/total')
  @ApiOperation({ summary: 'Get total revenue' })
  getTotalRevenue(@TenantId() tenantId: string) {
    return this.orderService.getTotalRevenue(tenantId);
  }

  @Get('revenue/range')
  @ApiOperation({ summary: 'Get revenue by date range' })
  getRevenueByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @TenantId() tenantId: string,
  ) {
    return this.orderService.getRevenueByDateRange(
      new Date(startDate),
      new Date(endDate),
      tenantId,
    );
  }

  @Get('date-range')
  @ApiOperation({ summary: 'Get orders by date range' })
  findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @TenantId() tenantId: string,
  ) {
    return this.orderService.findByDateRange(new Date(startDate), new Date(endDate), tenantId);
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get orders by customer' })
  findByCustomer(@Param('customerId') customerId: string, @TenantId() tenantId: string) {
    return this.orderService.findByCustomer(customerId, tenantId);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get orders by status' })
  findByStatus(@Param('status') status: string, @TenantId() tenantId: string) {
    return this.orderService.findByStatus(status, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.orderService.findOne(id, tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create order' })
  create(@Body() createOrderDto: CreateOrderDto, @TenantId() tenantId: string) {
    return this.orderService.create(createOrderDto, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update order' })
  update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @TenantId() tenantId: string,
  ) {
    return this.orderService.update(id, updateOrderDto, tenantId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @TenantId() tenantId: string,
  ) {
    return this.orderService.updateStatus(id, status, tenantId);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel order' })
  cancel(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.orderService.cancel(id, tenantId);
  }

  @Patch(':id/ship')
  @ApiOperation({ summary: 'Ship order' })
  ship(
    @Param('id') id: string,
    @Body('trackingNumber') trackingNumber: string,
    @TenantId() tenantId: string,
  ) {
    return this.orderService.ship(id, trackingNumber, tenantId);
  }

  @Patch(':id/deliver')
  @ApiOperation({ summary: 'Deliver order' })
  deliver(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.orderService.deliver(id, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete order' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.orderService.remove(id, tenantId);
    return { message: 'Order deleted successfully' };
  }
}
