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
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/common/security/permission.service';
@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  findAll(@CurrentUser() user: User) {
    return this.orderService.findAll(user);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending orders' })
  getPendingOrders(@CurrentUser() user: User) {
    return this.orderService.getPendingOrders(user);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get order count' })
  count(@CurrentUser() user: User) {
    return this.orderService.count(user);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get order statistics' })
  getStatistics(@CurrentUser() user: User) {
    return this.orderService.getStatistics(user);
  }

  @Get('recent/:limit')
  @ApiOperation({ summary: 'Get recent orders' })
  getRecentOrders(@CurrentUser() user: User, @Param('limit') limit: string) {
    const numLimit = parseInt(limit, 10);
    if (isNaN(numLimit) || numLimit <= 0) {
      throw new BadRequestException('Invalid limit parameter');
    }
    return this.orderService.getRecentOrders(user, numLimit);
  }

  @Get('revenue/total')
  @ApiOperation({ summary: 'Get total revenue' })
  getTotalRevenue(@CurrentUser() user: User) {
    return this.orderService.getTotalRevenue(user);
  }

  @Get('revenue/range')
  @ApiOperation({ summary: 'Get revenue by date range' })
  getRevenueByDateRange(
    @Query('startDate') startDate: string,
    @CurrentUser() user: User,
    @Query('endDate') endDate: string,
  ) {
    return this.orderService.getRevenueByDateRange(user, new Date(startDate), new Date(endDate));
  }

  @Get('date-range')
  @ApiOperation({ summary: 'Get orders by date range' })
  findByDateRange(
    @Query('startDate') startDate: string,
    @CurrentUser() user: User,
    @Query('endDate') endDate: string,
  ) {
    return this.orderService.findByDateRange(user, new Date(startDate), new Date(endDate));
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get orders by customer' })
  findByCustomer(@CurrentUser() user: User, @Param('customerId') customerId: string) {
    return this.orderService.findByCustomer(user, customerId);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get orders by status' })
  findByStatus(@CurrentUser() user: User, @Param('status') status: string) {
    return this.orderService.findByStatus(user, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.orderService.findOne(user, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create order' })
  create(@CurrentUser() user: User, @Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(user, createOrderDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update order' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.orderService.update(user, id, updateOrderDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  updateStatus(@Param('id') id: string, @CurrentUser() user: User, @Body('status') status: string) {
    return this.orderService.updateStatus(user, id, status);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel order' })
  cancel(@CurrentUser() user: User, @Param('id') id: string) {
    return this.orderService.cancel(user, id);
  }

  @Patch(':id/ship')
  @ApiOperation({ summary: 'Ship order' })
  ship(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body('trackingNumber') trackingNumber: string,
  ) {
    return this.orderService.ship(user, id, trackingNumber);
  }

  @Patch(':id/deliver')
  @ApiOperation({ summary: 'Deliver order' })
  deliver(@CurrentUser() user: User, @Param('id') id: string) {
    return this.orderService.deliver(user, id);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm order' })
  confirmOrder(@CurrentUser() user: User, @Param('id') id: string) {
    return this.orderService.confirmOrder(user, id);
  }

  @Post(':id/payment')
  @ApiOperation({ summary: 'Record payment for order' })
  recordPayment(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('amount') amount: number,
    @Body('paymentMethod') paymentMethod?: string,
  ) {
    return this.orderService.recordPayment(user, id, amount, paymentMethod);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete order' })
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    await this.orderService.remove(user, id);
    return { message: 'Order deleted successfully' };
  }
}
