import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WorkOrderService } from './work-order.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { FinishProductionDto } from './dto/finish-production.dto';
import { Roles } from '../../../common/decorators/roles.decorator';

import { User } from '@/common/security/permission.service';
@ApiTags('manufacturing-work-orders')
@ApiBearerAuth()
@Controller('manufacturing/work-orders')
export class WorkOrderController {
  constructor(private readonly workOrderService: WorkOrderService) {}

  @Post()
  @Roles('manager', 'admin', 'production_manager')
  @ApiOperation({ summary: 'Create a new work order' })
  @ApiResponse({ status: 201, description: 'Work order created successfully' })
  async create(@Body() dto: CreateWorkOrderDto, @Request() req) {
    return this.workOrderService.create(dto, req.user.tenantId, req.user);
  }

  @Get(':id')
  @Roles('manager', 'admin', 'production_manager', 'production_user')
  @ApiOperation({ summary: 'Get work order by ID' })
  @ApiResponse({ status: 200, description: 'Work order found' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.workOrderService.findOne(id, req.user.tenantId);
  }

  @Get('bom/:bomId')
  @Roles('manager', 'admin', 'production_manager', 'production_user')
  @ApiOperation({ summary: 'Get work orders by BOM ID' })
  @ApiResponse({ status: 200, description: 'Work orders found' })
  async findByBOM(@Param('bomId') bomId: string, @Request() req) {
    // findByBOM method not implemented yet
  }

  @Get('status/:status')
  @Roles('manager', 'admin', 'production_manager', 'production_user')
  @ApiOperation({ summary: 'Get work orders by status' })
  @ApiResponse({ status: 200, description: 'Work orders found' })
  async findByStatus(@Param('status') status: string, @Request() req) {
    return this.workOrderService.findByStatus(status as any, req.user.tenantId);
  }

  @Patch(':id/confirm')
  @Roles('manager', 'admin', 'production_manager')
  @ApiOperation({ summary: 'Confirm work order' })
  @ApiResponse({ status: 200, description: 'Work order confirmed' })
  async confirm(@Param('id') id: string, @Request() req) {
    return this.workOrderService.confirm(id, req.user.tenantId, req.user);
  }

  @Patch(':id/start')
  @Roles('manager', 'admin', 'production_manager', 'production_user')
  @ApiOperation({ summary: 'Start work order production' })
  @ApiResponse({ status: 200, description: 'Work order started' })
  async start(@Param('id') id: string, @Request() req) {
    return this.workOrderService.start(id, req.user.tenantId, req.user);
  }

  @Patch(':id/finish')
  @Roles('manager', 'admin', 'production_manager', 'production_user')
  @ApiOperation({ summary: 'Finish work order production' })
  @ApiResponse({ status: 200, description: 'Work order finished' })
  async finish(
    @Param('id') id: string,
    @Body() dto: FinishProductionDto,
    @Request() req,
  ) {
    return this.workOrderService.finish(id, dto.producedQuantity, req.user.tenantId, req.user);
  }

  @Patch(':id/cancel')
  @Roles('manager', 'admin', 'production_manager')
  @ApiOperation({ summary: 'Cancel work order' })
  @ApiResponse({ status: 200, description: 'Work order cancelled' })
  async cancel(@Param('id') id: string, @Request() req) {
    return this.workOrderService.cancel(id, req.user.tenantId, req.user);
  }
}
