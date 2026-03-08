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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/common/security/permission.service';
@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  @ApiOperation({ summary: 'Get all payments' })
  findAll(@CurrentUser() user: User) {
    return this.paymentService.findAll(user);
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get payments by order' })
  findByOrder(@CurrentUser() user: User, @Param('orderId') orderId: string) {
    return this.paymentService.findByOrder(user, orderId);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get payments by status' })
  findByStatus(@CurrentUser() user: User, @Param('status') status: string) {
    return this.paymentService.findByStatus(user, status);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get payment statistics' })
  getStatistics(@CurrentUser() user: User) {
    return this.paymentService.getPaymentStatistics(user);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get payment count' })
  count(@CurrentUser() user: User) {
    return this.paymentService.count(user);
  }

  @Get('total')
  @ApiOperation({ summary: 'Get total payment amount' })
  getTotalAmount(@CurrentUser() user: User, @Query('status') status: string) {
    return this.paymentService.getTotalAmount(user, status);
  }

  @Get('date-range')
  @ApiOperation({ summary: 'Get payments by date range' })
  getByDateRange(
    @CurrentUser() user: User,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.paymentService.getPaymentsByDateRange(
      user,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.paymentService.findOne(user, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create payment' })
  create(@CurrentUser() user: User, @Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.create(user, createPaymentDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update payment' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: User, @Body() updatePaymentDto: UpdatePaymentDto,
  ) {
    return this.paymentService.update(user, id, updatePaymentDto);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Complete payment' })
  complete(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('transactionId') transactionId: string,
  ) {
    return this.paymentService.complete(user, id, transactionId);
  }

  @Patch(':id/fail')
  @ApiOperation({ summary: 'Fail payment' })
  fail(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.paymentService.fail(user, id, reason);
  }

  @Patch(':id/refund')
  @ApiOperation({ summary: 'Refund payment' })
  refund(@CurrentUser() user: User, @Param('id') id: string) {
    return this.paymentService.refund(user, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete payment' })
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    await this.paymentService.remove(user, id);
    return { message: 'Payment deleted successfully' };
  }
}
