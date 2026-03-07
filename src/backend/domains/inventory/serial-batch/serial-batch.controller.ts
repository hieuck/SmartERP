import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SerialBatchService } from './serial-batch.service';
import { CreateSerialNumberDto } from './dto/create-serial-number.dto';
import { CreateBatchDto } from './dto/create-batch.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../hr/user/entities/user.entity';

@ApiTags('Serial/Batch Tracking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('serial-batch')
export class SerialBatchController {
  constructor(private readonly serialBatchService: SerialBatchService) {}

  @Post('serial')
  @Roles('manager', 'admin', 'warehouse_manager')
  @ApiOperation({ summary: 'Create a new serial number' })
  @ApiResponse({ status: 201, description: 'Serial number created successfully' })
  @ApiResponse({ status: 400, description: 'Serial number already exists' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async createSerialNumber(
    @Body() dto: CreateSerialNumberDto,
    @CurrentUser() user: User,
  ) {
    return this.serialBatchService.createSerialNumber(dto, user);
  }

  @Post('batch')
  @Roles('manager', 'admin', 'warehouse_manager')
  @ApiOperation({ summary: 'Create a new batch' })
  @ApiResponse({ status: 201, description: 'Batch created successfully' })
  @ApiResponse({ status: 400, description: 'Batch number already exists' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async createBatch(
    @Body() dto: CreateBatchDto,
    @CurrentUser() user: User,
  ) {
    return this.serialBatchService.createBatch(dto, user);
  }

  @Get('serial/product/:productId')
  @Roles('user', 'manager', 'admin', 'warehouse_manager')
  @ApiOperation({ summary: 'Get serial numbers by product' })
  @ApiResponse({ status: 200, description: 'Serial numbers retrieved successfully' })
  async getSerialNumbersByProduct(
    @Param('productId') productId: string,
    @CurrentUser() user: User,
  ) {
    return this.serialBatchService.getSerialNumbersByProduct(productId, user.tenantId);
  }

  @Get('batch/product/:productId')
  @Roles('user', 'manager', 'admin', 'warehouse_manager')
  @ApiOperation({ summary: 'Get batches by product' })
  @ApiResponse({ status: 200, description: 'Batches retrieved successfully' })
  async getBatchesByProduct(
    @Param('productId') productId: string,
    @CurrentUser() user: User,
  ) {
    return this.serialBatchService.getBatchesByProduct(productId, user.tenantId);
  }

  @Get('batch/:batchId/warehouse/:warehouseId')
  @Roles('user', 'manager', 'admin', 'warehouse_manager')
  @ApiOperation({ summary: 'Get batch stock by warehouse' })
  @ApiResponse({ status: 200, description: 'Batch stock retrieved successfully' })
  async getBatchStockByWarehouse(
    @Param('batchId') batchId: string,
    @Param('warehouseId') warehouseId: string,
    @CurrentUser() user: User,
  ) {
    return this.serialBatchService.getBatchStockByWarehouse(batchId, warehouseId, user.tenantId);
  }
}
