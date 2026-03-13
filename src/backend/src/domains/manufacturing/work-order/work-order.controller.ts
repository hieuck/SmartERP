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
import { WorkOrderStatus } from './enums/work-order-status.enum';
import { Roles } from '@common/decorators/roles.decorator';
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
    return this.workOrderService.create(req.user.tenantId, dto);
  }

  @Get(':id')
  @Roles('manager', 'admin', 'production_manager', 'production_user')
  @ApiOperation({ summary: 'Get work order by ID' })
  @ApiResponse({ status: 200, description: 'Work order found' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.workOrderService.findOne(req.user.tenantId, id);
  }

  @Get('bom/:bomId')
  @Roles('manager', 'admin', 'production_manager', 'production_user')
  @ApiOperation({ summary: 'Get work orders by BOM ID' })
  @ApiResponse({ status: 200, description: 'Work orders found' })
  async findByBOM(@Param('bomId') bomId: string, @Request() req) {
    return this.workOrderService.findByBOM(req.user.tenantId, bomId);
  }

  @Get('status/:status')
  @Roles('manager', 'admin', 'production_manager', 'production_user')
  @ApiOperation({ summary: 'Get work orders by status' })
  @ApiResponse({ status: 200, description: 'Work orders found' })
  async findByStatus(@Param('status') status: WorkOrderStatus, @Request() req) {
    return this.workOrderService.findByStatus(req.user.tenantId, status);
  }

  @Patch(':id/confirm')
  @Roles('manager', 'admin', 'production_manager')
  @ApiOperation({ summary: 'Confirm work order' })
  @ApiResponse({ status: 200, description: 'Work order confirmed' })
  async confirm(@Param('id') id: string, @Request() req) {
    return this.workOrderService.confirm(req.user.tenantId, id);
  }

  @Patch(':id/start')
  @Roles('manager', 'admin', 'production_manager', 'production_user')
  @ApiOperation({ summary: 'Start work order production' })
  @ApiResponse({ status: 200, description: 'Work order started' })
  async start(@Param('id') id: string, @Request() req) {
    return this.workOrderService.start(req.user.tenantId, id);
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
    return this.workOrderService.finish(req.user.tenantId, id, dto.producedQuantity);
  }

  @Patch(':id/cancel')
  @Roles('manager', 'admin', 'production_manager')
  @ApiOperation({ summary: 'Cancel work order' })
  @ApiResponse({ status: 200, description: 'Work order cancelled' })
  async cancel(@Param('id') id: string, @Request() req) {
    return this.workOrderService.cancel(req.user.tenantId, id);
  }
}
