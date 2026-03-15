// @ts-nocheck
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CacheTTL } from '../../../common/decorators/cache-ttl.decorator';
import { CacheInterceptor } from '../../../common/interceptors/cache.interceptor';
import { CacheTTL as CacheTTLConstant } from '../../../config/cache.config';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { ProcessPaymentDto, VerifyPaymentDto } from './dto/payment.dto';
import { RefundDto } from './dto/refund.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus, PaymentStatus, ShippingStatus } from '../enums/ecommerce.enum';
import { OrderService } from './order.service';
import { PaymentService } from './payment.service';

import { User } from '@/common/security/permission.service';
@ApiTags('Orders')
@Controller('orders')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly paymentService: PaymentService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create order manually' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() dto: CreateOrderDto, @Req() req: unknown) {
    const __tenantId = req.user?.tenantId || 'default';
    const user = req.user;
    return this.orderService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async findAll(
    @CurrentUser() user: User,
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('shippingStatus') shippingStatus?: string,
    @Query('customerId') customerId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters = {
      status: status as OrderStatus,
      paymentStatus: paymentStatus as PaymentStatus,
      shippingStatus: shippingStatus as ShippingStatus,
      customerId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };
    return this.orderService.findAll(user.tenantId, filters);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get order statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Req() req?: unknown,
  ) {
    const _tenantId = req.user?.tenantId || 'default';
    return this.orderService.getStatistics(
      _tenantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get orders by customer' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async findByCustomer(@Param('customerId') customerId: string, @CurrentUser() user: User) {
    return this.orderService.findByCustomer(customerId, user);
  }

  @Get('number/:orderNumber')
  @ApiOperation({ summary: 'Get order by order number' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findByOrderNumber(@Param('orderNumber') orderNumber: string, @CurrentUser() user: User) {
    return this.orderService.findByOrderNumber(orderNumber, user);
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(CacheTTLConstant.SHORT) // 1 minute - orders change frequently
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.orderService.findOne(id, user);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({ status: 200, description: 'Order status updated successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Req() req: unknown,
  ) {
    const __tenantId = req.user?.tenantId || 'default';
    const user = req.user;
    return this.orderService.updateStatus(id, dto, user, user);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel order' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Order cannot be cancelled' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async cancel(@Param('id') id: string, @Body() dto: CancelOrderDto, @Req() req: unknown) {
    const __tenantId = req.user?.tenantId || 'default';
    const user = req.user;
    return this.orderService.cancel(id, dto, user, user);
  }

  @Post('payment/process')
  @ApiOperation({ summary: 'Process payment' })
  @ApiResponse({ status: 200, description: 'Payment processed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async processPayment(@CurrentUser() user: User, @Body() dto: ProcessPaymentDto) {
    return this.paymentService.processPayment(dto, user);
  }

  @Post('payment/verify')
  @ApiOperation({ summary: 'Verify payment' })
  @ApiResponse({ status: 200, description: 'Payment verified successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async verifyPayment(@CurrentUser() user: User, @Body() dto: VerifyPaymentDto) {
    return this.paymentService.verifyPayment(dto, user);
  }

  @Post('payment/refund')
  @ApiOperation({ summary: 'Refund payment' })
  @ApiResponse({ status: 200, description: 'Payment refunded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async refundPayment(@CurrentUser() user: User, @Body() dto: RefundDto) {
    return this.paymentService.refundPayment(dto, user);
  }
}
