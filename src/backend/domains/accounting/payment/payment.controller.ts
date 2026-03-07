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
import { TenantGuard } from '../../common/guards/tenant.guard';
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
  findByOrder(@Param('orderId') orderId: string, @CurrentUser() user: User) {
    return this.paymentService.findByOrder(orderId, user);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get payments by status' })
  findByStatus(@Param('status') status: string, @CurrentUser() user: User) {
    return this.paymentService.findByStatus(status, user);
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
  getTotalAmount(@Query('status') status: string, @CurrentUser() user: User) {
    return this.paymentService.getTotalAmount(user, status);
  }

  @Get('date-range')
  @ApiOperation({ summary: 'Get payments by date range' })
  getByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user: User,
  ) {
    return this.paymentService.getPaymentsByDateRange(
      new Date(startDate), new Date(endDate), user,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.paymentService.findOne(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create payment' })
  create(@Body() createPaymentDto: CreatePaymentDto, @CurrentUser() user: User) {
    return this.paymentService.create(createPaymentDto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update payment' })
  update(
    @Param('id') id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
    @CurrentUser() user: User,
  ) {
    return this.paymentService.update(id, updatePaymentDto, user);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Complete payment' })
  complete(
    @Param('id') id: string,
    @Body('transactionId') transactionId: string,
    @CurrentUser() user: User,
  ) {
    return this.paymentService.complete(id, transactionId, user);
  }

  @Patch(':id/fail')
  @ApiOperation({ summary: 'Fail payment' })
  fail(@Param('id') id: string, @Body('reason') reason: string, @CurrentUser() user: User) {
    return this.paymentService.fail(id, reason, user);
  }

  @Patch(':id/refund')
  @ApiOperation({ summary: 'Refund payment' })
  refund(@Param('id') id: string, @CurrentUser() user: User) {
    return this.paymentService.refund(id, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete payment' })
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    await this.paymentService.remove(id, user);
    return { message: 'Payment deleted successfully' };
  }
}
