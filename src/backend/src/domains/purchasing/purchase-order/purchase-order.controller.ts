import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PurchaseOrderService } from './purchase-order.service';
import { JwtAuthGuard } from '@/core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/common/security/permission.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';

@ApiTags('purchase-orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('purchase-orders')
export class PurchaseOrderController {
  constructor(private readonly service: PurchaseOrderService) {}

  @Get()
  @ApiOperation({ summary: 'Get all purchase orders' })
  findAll(
    @CurrentUser() user: User,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.findAll(user, +page, +limit);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get purchase order statistics' })
  getStatistics(@CurrentUser() user: User) {
    return this.service.getStatistics(user);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get purchase orders by status' })
  findByStatus(@CurrentUser() user: User, @Param('status') status: string) {
    return this.service.findByStatus(user, status);
  }

  @Get('supplier/:supplierId')
  @ApiOperation({ summary: 'Get purchase orders by supplier' })
  findBySupplier(@CurrentUser() user: User, @Param('supplierId') supplierId: string) {
    return this.service.findBySupplier(user, supplierId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get purchase order by ID' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.findOne(user, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create purchase order' })
  create(@CurrentUser() user: User, @Body() dto: CreatePurchaseOrderDto) {
    return this.service.create(user, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update purchase order' })
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseOrderDto,
  ) {
    return this.service.update(user, id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update purchase order status' })
  updateStatus(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.service.updateStatus(user, id, status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete purchase order' })
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    await this.service.remove(user, id);
    return { message: 'Purchase order deleted successfully' };
  }
}
