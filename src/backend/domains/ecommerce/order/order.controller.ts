import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { PaymentService } from './payment.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { ProcessPaymentDto, VerifyPaymentDto } from './dto/payment.dto';
import { RefundDto } from './dto/refund.dto';
import { OrderStatus, PaymentStatus, ShippingStatus } from './entities/order.entity';
import { CacheInterceptor } from '../../../common/interceptors/cache.interceptor';
import { CacheTTL } from '../../../common/decorators/cache-ttl.decorator';
import { CacheTTL as CacheTTLConstant } from '../../../config/cache.config';

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
  async create(@Body() dto: CreateOrderDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || 'default';
    const user = req.user;
    return this.orderService.create(dto, user, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async findAll(
    @Query('status') status?: OrderStatus,
    @Query('paymentStatus') paymentStatus?: PaymentStatus,
    @Query('shippingStatus') shippingStatus?: ShippingStatus,
    @Query('customerId') customerId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Req() req?: any,
  ) {
    const tenantId = req.user?.tenantId || 'default';
    const filters = {
      status,
      paymentStatus,
      shippingStatus,
      customerId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };
    return this.orderService.findAll(user, filters);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get order statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Req() req?: any,
  ) {
    const tenantId = req.user?.tenantId || 'default';
    return this.orderService.getStatistics(
      tenantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get orders by customer' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async findByCustomer(@Param('customerId') customerId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || 'default';
    return this.orderService.findByCustomer(customerId, user);
  }

  @Get('number/:orderNumber')
  @ApiOperation({ summary: 'Get order by order number' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findByOrderNumber(@Param('orderNumber') orderNumber: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || 'default';
    return this.orderService.findByOrderNumber(orderNumber, user);
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(CacheTTLConstant.SHORT) // 1 minute - orders change frequently
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || 'default';
    return this.orderService.findOne(id, user);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({ status: 200, description: 'Order status updated successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Req() req: any,
  ) {
    const tenantId = req.user?.tenantId || 'default';
    const user = req.user;
    return this.orderService.updateStatus(id, dto, user, user);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel order' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Order cannot be cancelled' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async cancel(@Param('id') id: string, @Body() dto: CancelOrderDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || 'default';
    const user = req.user;
    return this.orderService.cancel(id, dto, user, user);
  }

  @Post('payment/process')
  @ApiOperation({ summary: 'Process payment' })
  @ApiResponse({ status: 200, description: 'Payment processed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async processPayment(@Body() dto: ProcessPaymentDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || 'default';
    return this.paymentService.processPayment(dto, user);
  }

  @Post('payment/verify')
  @ApiOperation({ summary: 'Verify payment' })
  @ApiResponse({ status: 200, description: 'Payment verified successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async verifyPayment(@Body() dto: VerifyPaymentDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || 'default';
    return this.paymentService.verifyPayment(dto, user);
  }

  @Post('payment/refund')
  @ApiOperation({ summary: 'Refund payment' })
  @ApiResponse({ status: 200, description: 'Payment refunded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async refundPayment(@Body() dto: RefundDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || 'default';
    return this.paymentService.refundPayment(dto, user);
  }
}
