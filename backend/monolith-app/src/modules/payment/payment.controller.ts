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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  @ApiOperation({ summary: 'Get all payments' })
  findAll(@TenantId() tenantId: string) {
    return this.paymentService.findAll(tenantId);
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get payments by order' })
  findByOrder(@Param('orderId') orderId: string, @TenantId() tenantId: string) {
    return this.paymentService.findByOrder(orderId, tenantId);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get payments by status' })
  findByStatus(@Param('status') status: string, @TenantId() tenantId: string) {
    return this.paymentService.findByStatus(status, tenantId);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get payment statistics' })
  getStatistics(@TenantId() tenantId: string) {
    return this.paymentService.getPaymentStatistics(tenantId);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get payment count' })
  count(@TenantId() tenantId: string) {
    return this.paymentService.count(tenantId);
  }

  @Get('total')
  @ApiOperation({ summary: 'Get total payment amount' })
  getTotalAmount(@Query('status') status: string, @TenantId() tenantId: string) {
    return this.paymentService.getTotalAmount(tenantId, status);
  }

  @Get('date-range')
  @ApiOperation({ summary: 'Get payments by date range' })
  getByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @TenantId() tenantId: string,
  ) {
    return this.paymentService.getPaymentsByDateRange(
      new Date(startDate),
      new Date(endDate),
      tenantId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.paymentService.findOne(id, tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create payment' })
  create(@Body() createPaymentDto: CreatePaymentDto, @TenantId() tenantId: string) {
    return this.paymentService.create(createPaymentDto, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update payment' })
  update(
    @Param('id') id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
    @TenantId() tenantId: string,
  ) {
    return this.paymentService.update(id, updatePaymentDto, tenantId);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Complete payment' })
  complete(
    @Param('id') id: string,
    @Body('transactionId') transactionId: string,
    @TenantId() tenantId: string,
  ) {
    return this.paymentService.complete(id, transactionId, tenantId);
  }

  @Patch(':id/fail')
  @ApiOperation({ summary: 'Fail payment' })
  fail(@Param('id') id: string, @Body('reason') reason: string, @TenantId() tenantId: string) {
    return this.paymentService.fail(id, reason, tenantId);
  }

  @Patch(':id/refund')
  @ApiOperation({ summary: 'Refund payment' })
  refund(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.paymentService.refund(id, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete payment' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.paymentService.remove(id, tenantId);
    return { message: 'Payment deleted successfully' };
  }
}
