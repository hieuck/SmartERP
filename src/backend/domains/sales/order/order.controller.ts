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
import { TenantGuard } from '../../common/guards/tenant.guard';
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

  @Get('recent/:limit')
  @ApiOperation({ summary: 'Get recent orders' })
  getRecentOrders(@Param('limit') limit: string, @CurrentUser() user: User) {
    const numLimit = parseInt(limit, 10);
    if (isNaN(numLimit) || numLimit <= 0) {
      throw new BadRequestException('Invalid limit parameter');
    }
    return this.orderService.getRecentOrders(numLimit, user);
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
    @Query('endDate') endDate: string,
    @CurrentUser() user: User,
  ) {
    return this.orderService.getRevenueByDateRange(
      new Date(startDate), new Date(endDate), user,
    );
  }

  @Get('date-range')
  @ApiOperation({ summary: 'Get orders by date range' })
  findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user: User,
  ) {
    return this.orderService.findByDateRange(new Date(startDate), new Date(endDate), user);
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get orders by customer' })
  findByCustomer(@Param('customerId') customerId: string, @CurrentUser() user: User) {
    return this.orderService.findByCustomer(customerId, user);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get orders by status' })
  findByStatus(@Param('status') status: string, @CurrentUser() user: User) {
    return this.orderService.findByStatus(status, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.orderService.findOne(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create order' })
  create(@Body() createOrderDto: CreateOrderDto, @CurrentUser() user: User) {
    return this.orderService.create(createOrderDto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update order' })
  update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @CurrentUser() user: User,
  ) {
    return this.orderService.update(id, updateOrderDto, user);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser() user: User,
  ) {
    return this.orderService.updateStatus(id, status, user);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel order' })
  cancel(@Param('id') id: string, @CurrentUser() user: User) {
    return this.orderService.cancel(id, user);
  }

  @Patch(':id/ship')
  @ApiOperation({ summary: 'Ship order' })
  ship(
    @Param('id') id: string,
    @Body('trackingNumber') trackingNumber: string,
    @CurrentUser() user: User,
  ) {
    return this.orderService.ship(id, trackingNumber, user);
  }

  @Patch(':id/deliver')
  @ApiOperation({ summary: 'Deliver order' })
  deliver(@Param('id') id: string, @CurrentUser() user: User) {
    return this.orderService.deliver(id, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete order' })
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    await this.orderService.remove(id, user);
    return { message: 'Order deleted successfully' };
  }
}
